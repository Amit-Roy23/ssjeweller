import {
  MetalType,
  WorkPriority,
  WorkStatusValue,
  QCResult,
} from '@prisma/client'
import { db } from '@/lib/db'
import { generateWorkOrderId } from './sequence.service'

export interface CreateWorkOrderInput {
  productCode?: string | null
  productName: string
  customerName?: string | null
  workflowId: string
  grossWeightMg: bigint
  purity: string
  metal?: MetalType
  priority?: WorkPriority
  expectedCompletion: Date
  notes?: string | null
  assignedToId?: string | null
  createdByUserId: string
  createdByUserName: string
  ipAddress?: string | null
}

export interface UpdateStepInput {
  workOrderId: string
  stepIndex: number
  status: WorkStatusValue
  inputWeightMg?: bigint | null
  outputWeightMg?: bigint | null
  assignedToId?: string | null
  remarks?: string | null
  actorUserId: string
  actorUserName: string
  ipAddress?: string | null
}

export interface RecordQCInput {
  workOrderId: string
  weightChecked: boolean
  purityChecked: boolean
  designChecked: boolean
  stoneChecked: boolean
  finishingChecked: boolean
  result: QCResult
  remarks?: string | null
  checkedById: string
  checkedByName: string
  ipAddress?: string | null
}

export const WorkshopService = {
  /**
   * Creates a new Work Order with sequential steps copied from Workflow template.
   */
  async createWorkOrder(input: CreateWorkOrderInput) {
    return db.$transaction(async (tx) => {
      // 1. Fetch workflow template with steps
      const workflow = await tx.workflow.findUnique({
        where: { id: input.workflowId },
        include: { steps: { orderBy: { order: 'asc' } } },
      })

      if (!workflow) throw new Error('Workflow not found')
      if (workflow.steps.length === 0) throw new Error('Workflow has no defined steps')

      // 2. Generate atomic gap-free work ID (e.g. WF-10029)
      const workId = await generateWorkOrderId(tx)

      let assignedToName: string | null = null
      if (input.assignedToId) {
        const user = await tx.user.findUnique({ where: { id: input.assignedToId } })
        assignedToName = user?.name ?? null
      }

      // 3. Create work order
      const workOrder = await tx.workOrder.create({
        data: {
          workId,
          productCode: input.productCode || null,
          productName: input.productName,
          customerName: input.customerName || null,
          workflowId: workflow.id,
          workflowName: workflow.name,
          currentStepIndex: 0,
          grossWeightMg: input.grossWeightMg,
          purity: input.purity,
          metal: input.metal ?? MetalType.GOLD,
          priority: input.priority ?? WorkPriority.NORMAL,
          status: WorkStatusValue.ASSIGNED,
          assignedToId: input.assignedToId || null,
          assignedToName,
          expectedCompletion: input.expectedCompletion,
          notes: input.notes || null,
          steps: {
            create: workflow.steps.map((s, idx) => ({
              stepId: s.id,
              stepName: s.name,
              order: s.order,
              assignedToId: idx === 0 && input.assignedToId ? input.assignedToId : s.defaultUserId,
              status: idx === 0 ? WorkStatusValue.ASSIGNED : WorkStatusValue.PENDING,
            })),
          },
          history: {
            create: {
              userId: input.createdByUserId,
              userName: input.createdByUserName,
              action: 'CREATE_WORK_ORDER',
              details: `Created work order ${workId} (${input.productName}) under ${workflow.name}`,
            },
          },
        },
        include: {
          steps: { orderBy: { order: 'asc' } },
          history: true,
        },
      })

      // 4. Log audit
      await tx.auditLog.create({
        data: {
          userId: input.createdByUserId,
          userName: input.createdByUserName,
          action: 'CREATE_WORK_ORDER',
          entity: 'WorkOrder',
          entityId: workOrder.id,
          details: `Created work order ${workId} for ${input.productName}`,
          ipAddress: input.ipAddress || null,
        },
      })

      return workOrder
    })
  },

  /**
   * Updates an individual step in the work order with automated wastage calculation.
   */
  async updateWorkOrderStep(input: UpdateStepInput) {
    return db.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findUnique({
        where: { id: input.workOrderId },
        include: { steps: { orderBy: { order: 'asc' } } },
      })

      if (!workOrder) throw new Error('Work order not found')
      const targetStep = workOrder.steps[input.stepIndex]
      if (!targetStep) throw new Error(`Step index ${input.stepIndex} does not exist`)

      const isCompleting = input.status === WorkStatusValue.COMPLETED
      const completedAt = isCompleting ? new Date() : targetStep.completedAt

      let assignedToName = targetStep.assignedToName
      if (input.assignedToId && input.assignedToId !== targetStep.assignedToId) {
        const assignedUser = await tx.user.findUnique({ where: { id: input.assignedToId } })
        assignedToName = assignedUser?.name ?? null
      }

      // Calculate wastage if both weights present
      const inputWeightMg = input.inputWeightMg ?? targetStep.inputWeightMg
      const outputWeightMg = input.outputWeightMg ?? targetStep.outputWeightMg
      let wastageMg: bigint | null = null

      if (inputWeightMg != null && outputWeightMg != null && inputWeightMg >= outputWeightMg) {
        wastageMg = inputWeightMg - outputWeightMg
      }

      // Update the step
      const updatedStep = await tx.workOrderStep.update({
        where: { id: targetStep.id },
        data: {
          status: input.status,
          inputWeightMg,
          outputWeightMg,
          wastageMg,
          assignedToId: input.assignedToId ?? targetStep.assignedToId,
          assignedToName,
          remarks: input.remarks ?? targetStep.remarks,
          completedAt,
        },
      })

      // Record wastage record if positive wastage
      if (wastageMg && wastageMg > 0n && inputWeightMg && inputWeightMg > 0n) {
        const wastageBps = Math.round(Number((wastageMg * 10000n) / inputWeightMg))
        await tx.wastageRecord.create({
          data: {
            workOrderId: workOrder.id,
            workId: workOrder.workId,
            stepName: targetStep.stepName,
            userId: input.actorUserId,
            userName: input.actorUserName,
            inputWeightMg,
            outputWeightMg: outputWeightMg!,
            wastageWeightMg: wastageMg,
            wastageBps,
          },
        })
      }

      // Advance next step if completing
      let nextStepIndex = workOrder.currentStepIndex
      let nextStatus = workOrder.status

      if (isCompleting && input.stepIndex + 1 < workOrder.steps.length) {
        nextStepIndex = input.stepIndex + 1
        const nextStep = workOrder.steps[nextStepIndex]

        // Advance next step to IN_PROGRESS or ASSIGNED
        await tx.workOrderStep.update({
          where: { id: nextStep.id },
          data: {
            status: WorkStatusValue.ASSIGNED,
            startedAt: new Date(),
          },
        })
        nextStatus = WorkStatusValue.IN_PROGRESS
      } else if (isCompleting && input.stepIndex + 1 >= workOrder.steps.length) {
        nextStatus = WorkStatusValue.COMPLETED
      }

      // Update work order and return with full refreshed steps and relations
      const updatedWorkOrder = await tx.workOrder.update({
        where: { id: workOrder.id },
        data: {
          currentStepIndex: nextStepIndex,
          status: nextStatus,
          netWeightMg: outputWeightMg ?? workOrder.netWeightMg,
          version: { increment: 1 },
        },
        include: {
          steps: { orderBy: { order: 'asc' } },
          history: { orderBy: { timestamp: 'desc' } },
          qualityChecks: true,
          wastageRecords: true,
          workflow: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      })

      // Record history
      await tx.workHistory.create({
        data: {
          workOrderId: workOrder.id,
          userId: input.actorUserId,
          userName: input.actorUserName,
          action: `STEP_${input.status}`,
          details: `${targetStep.stepName} marked as ${input.status}${wastageMg ? ` (Wastage: ${Number(wastageMg)/1000}g)` : ''}`,
        },
      })

      // Log audit
      await tx.auditLog.create({
        data: {
          userId: input.actorUserId,
          userName: input.actorUserName,
          action: 'UPDATE_WORK_STEP',
          entity: 'WorkOrder',
          entityId: workOrder.id,
          details: `Updated ${targetStep.stepName} to ${input.status} on ${workOrder.workId}`,
          ipAddress: input.ipAddress || null,
        },
      })

      return { workOrder: updatedWorkOrder, step: updatedStep }
    })
  },

  /**
   * Records Quality Check (QC) inspection result.
   */
  async recordQualityCheck(input: RecordQCInput) {
    return db.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findUnique({
        where: { id: input.workOrderId },
      })

      if (!workOrder) throw new Error('Work order not found')

      const qc = await tx.qualityCheck.create({
        data: {
          workOrderId: workOrder.id,
          workId: workOrder.workId,
          productName: workOrder.productName,
          weightChecked: input.weightChecked,
          purityChecked: input.purityChecked,
          designChecked: input.designChecked,
          stoneChecked: input.stoneChecked,
          finishingChecked: input.finishingChecked,
          result: input.result,
          remarks: input.remarks || null,
          checkedById: input.checkedById,
        },
      })

      const isApproved = input.result === QCResult.APPROVED
      const newStatus = isApproved ? WorkStatusValue.APPROVED : WorkStatusValue.REWORK_REQUIRED

      await tx.workOrder.update({
        where: { id: workOrder.id },
        data: {
          status: newStatus,
          actualCompletion: isApproved ? new Date() : null,
          version: { increment: 1 },
        },
      })

      await tx.workHistory.create({
        data: {
          workOrderId: workOrder.id,
          userId: input.checkedById,
          userName: input.checkedByName,
          action: isApproved ? 'QC_APPROVED' : 'QC_REJECTED',
          details: isApproved
            ? 'Quality inspection passed. Ready for catalog/delivery.'
            : `QC rejected: ${input.remarks || 'Needs rework'}`,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: input.checkedById,
          userName: input.checkedByName,
          action: isApproved ? 'QC_APPROVED' : 'QC_REJECTED',
          entity: 'WorkOrder',
          entityId: workOrder.id,
          details: `QC inspection ${input.result} for ${workOrder.workId}`,
          ipAddress: input.ipAddress || null,
        },
      })

      return qc
    })
  },
}
