"use client";

import React, { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { InteractiveDagNode, DagNodeData } from "@/components/ui/InteractiveDagNode";
import { TaskRecord } from "@/lib/types";

const nodeTypes = {
  customDagNode: InteractiveDagNode,
};

interface OrderDagProps {
  isResolved: boolean;
  selectedTaskId: string;
  onSelectTask: (taskId: string) => void;
  dagGrid: boolean;
  dagMinimap: boolean;
  tasks?: TaskRecord[];
  orderState?: string;
  chargingStatus?: "FAILED" | "ROLLED_BACK" | "UNDONE" | "SUCCEEDED";
}

export function OrderDagCanvas({
  isResolved,
  selectedTaskId,
  onSelectTask,
  dagGrid,
  dagMinimap,
  tasks = [],
  orderState,
  chargingStatus = "FAILED",
}: OrderDagProps) {
  // Define standard layout coordinate registry for product task graphs
  const positions: Record<string, { x: number; y: number }> = useMemo(
    () => ({
      validate_order: { x: 30, y: 155 },
      // Inventory tasks (Wave 2, Upper branch)
      reserve_inventory: { x: 270, y: 70 },
      reserve_sim: { x: 270, y: 70 },
      reserve_esim_profile: { x: 270, y: 70 },
      // Billing account setup (Wave 2, Lower branch)
      create_billing_account: { x: 270, y: 240 },
      // Network provisioning (Wave 3, Upper branch)
      provision_network: { x: 490, y: 70 },
      provision_5g_core: { x: 490, y: 70 },
      activate_network_profile: { x: 490, y: 70 },
      // Verification tasks (Wave 4, Convergence)
      verify_service: { x: 710, y: 70 },
      verify_sim_registration: { x: 710, y: 70 },
      verify_activation: { x: 710, y: 70 },
      // Billing start (Wave 5)
      start_billing: { x: 930, y: 155 },
      // Completion (Wave 6)
      complete_order: { x: 1150, y: 100 },
      notify_customer: { x: 1150, y: 220 },
      // Compensation / Rollback cascade positions
      deprovision_network: { x: 490, y: 350 },
      release_inventory: { x: 270, y: 350 },
      void_billing_account: { x: 50, y: 350 },
    }),
    []
  );

  const systemLabels: Record<string, string> = useMemo(
    () => ({
      oms: "OMS",
      inventory: "SIM/eSIM",
      network: "Network",
      billing: "OCS",
      notification: "SMS-C",
    }),
    []
  );

  // Dynamic topological layout calculator for arbitrary product graphs
  const layoutPositions = useMemo(() => {
    if (!tasks || tasks.length === 0) return positions;
    const taskMap = new Map(tasks.map((t) => [t.task_id, t]));
    const depths = new Map<string, number>();

    const getDepth = (tid: string, visited = new Set<string>()): number => {
      if (depths.has(tid)) return depths.get(tid)!;
      if (visited.has(tid)) return 0;
      visited.add(tid);
      const t = taskMap.get(tid);
      if (!t || !t.depends_on || t.depends_on.length === 0) {
        depths.set(tid, 0);
        return 0;
      }
      let maxD = 0;
      for (const dep of t.depends_on) {
        maxD = Math.max(maxD, getDepth(dep, visited) + 1);
      }
      depths.set(tid, maxD);
      return maxD;
    };

    tasks.forEach((t) => getDepth(t.task_id));

    // Group by wave
    const waveGroups = new Map<number, string[]>();
    tasks.forEach((t) => {
      const d = depths.get(t.task_id) || 0;
      if (!waveGroups.has(d)) waveGroups.set(d, []);
      waveGroups.get(d)!.push(t.task_id);
    });

    const res: Record<string, { x: number; y: number }> = { ...positions };
    waveGroups.forEach((tids, wave) => {
      tids.forEach((tid, idx) => {
        if (!res[tid]) {
          const totalInWave = tids.length;
          const yOffset = totalInWave === 1 ? 155 : 70 + idx * 130;
          res[tid] = { x: 30 + wave * 220, y: yOffset };
        }
      });
    });
    return res;
  }, [tasks, positions]);

  const getInitialNodes = useCallback((): Node<DagNodeData>[] => {
    // If we have live tasks from the backend, build the DAG dynamically!
    if (tasks && tasks.length > 0) {
      return tasks.map((t, idx) => {
        const pos =
          layoutPositions[t.task_id] || {
            x: 30 + (idx % 4) * 230,
            y: 70 + Math.floor(idx / 4) * 110,
          };
        const isSelected = selectedTaskId === t.task_id;

        let status: DagNodeData["status"] = "SUCCEEDED";
        let isStalled = false;
        const isBestEffort = t.task_id === "notify_customer";

        if (t.state === "RUNNING") {
          status = "RUNNING";
        } else if (t.state === "RETRYING") {
          status = "RETRYING";
        } else if (t.state === "FAILED") {
          status = "FAILED";
        } else if (t.state === "COMPENSATION_FAILED") {
          status = isResolved ? "RESOLVED" : "FAILED";
          isStalled = !isResolved;
        } else if (t.state === "COMPENSATED") {
          status = isResolved ? "RESOLVED" : "COMPENSATED";
        } else if (t.state === "COMPENSATING") {
          status = "RUNNING";
        } else if (t.state === "PENDING") {
          status = "PAUSED / WAITING";
          isStalled = false;
        } else if (t.state === "SKIPPED") {
          status = "PAUSED / WAITING";
          isStalled = true;
        }

        // Calculate actual duration from ISO timestamps if present
        let durationText = "--";
        if (t.started_at && t.ended_at) {
          const startMs = new Date(t.started_at).getTime();
          const endMs = new Date(t.ended_at).getTime();
          const diffMs = Math.max(0, endMs - startMs);
          durationText = diffMs >= 1000 ? `${(diffMs / 1000).toFixed(2)}s` : `${diffMs}ms`;
        } else if (t.started_at && t.state === "RUNNING") {
          durationText = "In flight";
        } else if (t.state === "RETRYING") {
          durationText = "Backoff";
        } else if (t.last_error) {
          durationText = "Error";
        }

        // Formulate clear diagnostic metadata
        let metaLeft = t.state as string;
        if (t.attempts > 1) {
          metaLeft = t.state === "FAILED" ? `Failed (×${t.attempts})` : `Attempt ×${t.attempts}`;
        } else if (t.state === "SUCCEEDED") {
          metaLeft = "Completed";
        } else if (t.state === "RUNNING") {
          metaLeft = "Executing";
        } else if (t.state === "RETRYING") {
          metaLeft = `Retry #${t.attempts}`;
        } else if (t.state === "COMPENSATING") {
          metaLeft = "Compensating";
        } else if (t.state === "COMPENSATED") {
          metaLeft = isResolved ? "Resolved" : "Compensated";
        } else if (t.state === "COMPENSATION_FAILED") {
          metaLeft = isResolved ? "NOC Cleared" : "Comp. Failed";
        } else if (t.state === "SKIPPED") {
          metaLeft = orderState === "CANCELLED" ? "Cancelled" : "Skipped";
        } else if (t.state === "PENDING") {
          metaLeft = "Queued";
        }

        let badgeText: string | undefined = undefined;
        let badgeStyle: DagNodeData["badgeStyle"] = "default";

        if (t.state === "COMPENSATION_FAILED") {
          badgeText = isResolved ? "RESOLVED" : "FALLOUT";
          badgeStyle = isResolved ? "noc" : "failed";
        } else if (t.state === "COMPENSATED") {
          badgeText = "UNDONE";
          badgeStyle = isResolved ? "noc" : "default";
        } else if (t.state === "FAILED") {
          badgeText = t.attempts > 1 ? `×${t.attempts}` : "FAIL";
          badgeStyle = "failed";
        } else if (t.state === "RETRYING") {
          badgeText = `×${t.attempts}`;
          badgeStyle = "attempt";
        } else if (t.attempts > 1) {
          badgeText = `×${t.attempts}`;
        }

        const nameFormatted = t.task_id
          .split("_")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

        return {
          id: t.task_id,
          type: "customDagNode",
          position: pos,
          data: {
            taskId: t.task_id,
            system:
              systemLabels[t.system.toLowerCase()] || t.system.toUpperCase(),
            name: nameFormatted,
            metaLeft,
            metaRight: durationText,
            status,
            badgeText,
            badgeStyle,
            isResolved,
            isStalled,
            isBestEffort,
            isSelected,
            tooltipTitle: t.last_error
              ? `Task ${t.task_id} Failure Alert`
              : t.state === "COMPENSATED"
              ? `Task ${t.task_id} Compensated`
              : undefined,
            tooltipText: t.last_error
              ? t.last_error
              : t.state === "COMPENSATED"
              ? "Resource rolled back and released. Tombstone written."
              : undefined,
          },
        };
      });
    }

    // Default Fallback Demo Graph (Adaptable to diverse failed task points if tasks array is empty)
    const isStartBillingFailed = selectedTaskId === "start_billing" || (!["reserve_inventory", "provision_network", "verify_service", "create_billing_account", "deprovision_network"].includes(selectedTaskId));
    const isReserveInvFailed = selectedTaskId === "reserve_inventory";
    const isProvNetFailed = selectedTaskId === "provision_network";
    const isVerifyFailed = selectedTaskId === "verify_service";
    const isCreateBillingFailed = selectedTaskId === "create_billing_account";

    return [
      {
        id: "validate_order",
        type: "customDagNode",
        position: { x: 30, y: 155 },
        data: {
          taskId: "validate_order",
          system: "OMS",
          name: "Validate Order",
          metaLeft: "Task #1",
          metaRight: "220ms",
          status: "SUCCEEDED",
          isSelected: selectedTaskId === "validate_order",
        },
      },
      {
        id: "reserve_inventory",
        type: "customDagNode",
        position: { x: 270, y: 70 },
        data: {
          taskId: "reserve_inventory",
          system: "SIM/eSIM",
          name: "Reserve Inventory",
          metaLeft: isReserveInvFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "Restored" : "Err 409") : "Branch A",
          metaRight: isReserveInvFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "Clean" : "1.89s") : "340ms",
          status: isReserveInvFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "RESOLVED" : "FAILED") : "SUCCEEDED",
          badgeText: isReserveInvFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "RESOLVED" : "×3") : undefined,
          badgeStyle: isReserveInvFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "noc" : "failed") : undefined,
          isSelected: selectedTaskId === "reserve_inventory",
        },
      },
      {
        id: "provision_network",
        type: "customDagNode",
        position: { x: 490, y: 70 },
        data: {
          taskId: "provision_network",
          system: "HLR/HSS",
          name: "Provision Network",
          metaLeft: isProvNetFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "Restored" : "HLR 504") : "hlr-east-01",
          metaRight: isProvNetFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "Clean" : "3.95s") : "1.42s",
          status: isProvNetFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "RESOLVED" : "FAILED") : (isReserveInvFailed ? "PAUSED / WAITING" : "SUCCEEDED"),
          badgeText: isProvNetFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "RESOLVED" : "×3") : undefined,
          badgeStyle: isProvNetFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "noc" : "failed") : undefined,
          isSelected: selectedTaskId === "provision_network",
        },
      },
      {
        id: "verify_service",
        type: "customDagNode",
        position: { x: 710, y: 70 },
        data: {
          taskId: "verify_service",
          system: "Network",
          name: "Verify Service",
          metaLeft: isVerifyFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "Restored" : "Radius 401") : "Ping/Radius",
          metaRight: isVerifyFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "Clean" : "5.40s") : "610ms",
          status: isVerifyFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "RESOLVED" : "FAILED") : (isReserveInvFailed || isProvNetFailed ? "PAUSED / WAITING" : "SUCCEEDED"),
          badgeText: isVerifyFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "RESOLVED" : "×3") : undefined,
          badgeStyle: isVerifyFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "noc" : "failed") : undefined,
          isSelected: selectedTaskId === "verify_service",
        },
      },
      {
        id: "create_billing_account",
        type: "customDagNode",
        position: { x: 270, y: 240 },
        data: {
          taskId: "create_billing_account",
          system: "OCS",
          name: "Create Billing Acct",
          metaLeft: isCreateBillingFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "Restored" : "Err 422") : "Branch B",
          metaRight: isCreateBillingFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "Clean" : "2.80s") : "420ms",
          status: isCreateBillingFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "RESOLVED" : "FAILED") : "SUCCEEDED",
          badgeText: isCreateBillingFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "RESOLVED" : "×3") : undefined,
          badgeStyle: isCreateBillingFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "noc" : "failed") : undefined,
          isSelected: selectedTaskId === "create_billing_account",
        },
      },
      {
        id: "start_billing",
        type: "customDagNode",
        position: { x: 930, y: 155 },
        data: {
          taskId: "start_billing",
          system: "OCS Rating",
          name: "Start Charging",
          metaLeft: isStartBillingFailed ? (chargingStatus === "ROLLED_BACK" ? "Rolled Back" : chargingStatus === "UNDONE" ? "Request Undone" : "OCS 500: Time...") : "Queued",
          metaRight: isStartBillingFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "Restored" : "3.00s") : "--",
          status: isStartBillingFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "RESOLVED" : "FAILED") : "PAUSED / WAITING",
          badgeText: isStartBillingFailed ? (chargingStatus === "ROLLED_BACK" ? "ROLLED_BACK" : chargingStatus === "UNDONE" ? "UNDONE" : "×3") : undefined,
          badgeStyle: isStartBillingFailed ? (chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "noc" : "attempt") : undefined,
          isSelected: selectedTaskId === "start_billing",
        },
      },
      {
        id: "deprovision_network",
        type: "customDagNode",
        position: { x: 490, y: 350 },
        data: {
          taskId: "deprovision_network",
          system: "HLR/HSS",
          name: "Deprovision Network",
          metaLeft: isResolved ? "Operator Over..." : "504 Gateway...",
          metaRight: isResolved ? "Done" : "5.94s",
          status: isResolved ? "RESOLVED" : "FAILED",
          badgeText: isResolved ? "NOC" : "5× Fail",
          badgeStyle: isResolved ? "noc" : "failed",
          isResolved: isResolved,
          tooltipTitle: isResolved
            ? "Rollback Completed: Operator Override Applied"
            : "Rollback Stalled: Deprovision Network Failed",
          tooltipText: isResolved
            ? "HLR Profile purged manually via NOC override ticket. Subsequent rollbacks and tombstone records verified."
            : "Compensation halted at Deprovision Network (5 retries exhausted). Subsequent rollbacks Release Inventory (WAITING) and Void Billing (WAITING) are paused until operator resolves.",
          isSelected: selectedTaskId === "deprovision_network",
        },
      },
      {
        id: "release_inventory",
        type: "customDagNode",
        position: { x: 270, y: 350 },
        data: {
          taskId: "release_inventory",
          system: "SIM/eSIM",
          name: "Release Inventory",
          metaLeft: "Compensation #2",
          metaRight: "blocked",
          status: "STALLED",
          isStalled: true,
          isSelected: selectedTaskId === "release_inventory",
        },
      },
      {
        id: "void_billing_account",
        type: "customDagNode",
        position: { x: 50, y: 350 },
        data: {
          taskId: "void_billing_account",
          system: "OCS",
          name: "Void Billing Acct",
          metaLeft: "Compensation #3",
          metaRight: "blocked",
          status: "STALLED",
          isStalled: true,
          isSelected: selectedTaskId === "void_billing_account",
        },
      },
      {
        id: "notify_customer",
        type: "customDagNode",
        position: { x: 270, y: 460 },
        data: {
          taskId: "notify_customer",
          system: "SMS-C",
          name: "Notify Customer",
          metaLeft: "PAUSED / WAITING",
          metaRight: "--",
          status: "PAUSED / WAITING",
          isBestEffort: true,
          isSelected: selectedTaskId === "notify_customer",
        },
      },
    ];
  }, [isResolved, selectedTaskId, tasks, layoutPositions, systemLabels, orderState, chargingStatus]);

  // Compute dynamic edges matching the product catalog task DAG
  const computeEdges = useCallback((): Edge[] => {
    if (tasks && tasks.length > 0) {
      const taskIds = new Set(tasks.map((t) => t.task_id));
      const taskMap = new Map(tasks.map((t) => [t.task_id, t]));
      const edgesList: Edge[] = [];

      let hasExplicitDeps = false;
      tasks.forEach((t) => {
        if (t.depends_on && Array.isArray(t.depends_on) && t.depends_on.length > 0) {
          hasExplicitDeps = true;
          t.depends_on.forEach((dep: string) => {
            if (taskIds.has(dep)) {
              const sourceTask = taskMap.get(dep);
              const targetTask = t;

              let color = "#2563EB";
              let animated = false;
              let strokeDasharray = undefined;

              if (targetTask.state === "RUNNING" || targetTask.state === "RETRYING" || targetTask.state === "COMPENSATING") {
                animated = true;
                color = targetTask.state === "RETRYING" ? "#EEB930" : "#2563EB";
              } else if (targetTask.state === "FAILED" || (targetTask.state === "COMPENSATION_FAILED" && !isResolved)) {
                color = "#ED2C2C";
              } else if (targetTask.state === "COMPENSATED" || sourceTask?.state === "COMPENSATED") {
                color = "#8B7B65";
                strokeDasharray = "3 3";
              } else if (targetTask.state === "SKIPPED" || targetTask.state === "PENDING") {
                color = "#CBD5E1";
                strokeDasharray = "2 2";
              } else if (sourceTask?.state === "SUCCEEDED" && targetTask.state === "SUCCEEDED") {
                color = "#22C55E";
              }

              edgesList.push({
                id: `e-${dep}-${t.task_id}`,
                source: dep,
                target: t.task_id,
                type: "smoothstep",
                animated,
                markerEnd: { type: MarkerType.ArrowClosed, color },
                style: { stroke: color, strokeWidth: 2, strokeDasharray },
              });
            }
          });
        }
      });

      if (!hasExplicitDeps) {
        const addEdgeIfBothExist = (
          source: string,
          target: string,
          color = "#2563EB",
          styleExtra?: React.CSSProperties
        ) => {
          if (taskIds.has(source) && taskIds.has(target)) {
            edgesList.push({
              id: `e-${source}-${target}`,
              source,
              target,
              type: "smoothstep",
              markerEnd: { type: MarkerType.ArrowClosed, color },
              style: { stroke: color, strokeWidth: 2, ...styleExtra },
            });
          }
        };

        const invTask = tasks.find((t) =>
          ["reserve_inventory", "reserve_sim", "reserve_esim_profile"].includes(t.task_id)
        )?.task_id;

        const netTask = tasks.find((t) =>
          ["provision_network", "provision_5g_core", "activate_network_profile"].includes(t.task_id)
        )?.task_id;

        const verTask = tasks.find((t) =>
          ["verify_service", "verify_sim_registration", "verify_activation"].includes(t.task_id)
        )?.task_id;

        if (invTask) {
          addEdgeIfBothExist("validate_order", invTask);
        }
        if (invTask) {
          addEdgeIfBothExist(invTask, "create_billing_account");
        }
        if (invTask && netTask) {
          addEdgeIfBothExist(invTask, netTask);
        }
        if (netTask && verTask) {
          addEdgeIfBothExist(netTask, verTask);
        }
        if (verTask) {
          addEdgeIfBothExist("create_billing_account", verTask);
        }
        if (verTask) {
          addEdgeIfBothExist(verTask, "start_billing");
        } else if (netTask) {
          addEdgeIfBothExist(netTask, "start_billing");
        }
        addEdgeIfBothExist("start_billing", "complete_order");
        addEdgeIfBothExist("start_billing", "notify_customer");
      }

      // If order is rolled back or has fallout, add reverse compensation links
      const failedTask = tasks.find((t) => t.state === "FAILED" || t.state === "COMPENSATION_FAILED");
      const compensatedTasks = tasks.filter((t) => t.state === "COMPENSATED");
      if (failedTask && compensatedTasks.length > 0) {
        compensatedTasks.forEach((ct) => {
          if (!edgesList.some((e) => e.source === failedTask.task_id && e.target === ct.task_id)) {
            edgesList.push({
              id: `e-rollback-${failedTask.task_id}-${ct.task_id}`,
              source: failedTask.task_id,
              target: ct.task_id,
              type: "smoothstep",
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed, color: "#ED2C2C" },
              style: { stroke: "#ED2C2C", strokeWidth: 2, strokeDasharray: "4 4" },
            });
          }
        });
      }

      return edgesList;
    }

    // Static fallback edges for S11 demo scenario
    return [
      {
        id: "e-validate-reserve",
        source: "validate_order",
        target: "reserve_inventory",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563EB" },
        style: { stroke: "#2563EB", strokeWidth: 2 },
      },
      {
        id: "e-validate-billing",
        source: "validate_order",
        target: "create_billing_account",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563EB" },
        style: { stroke: "#2563EB", strokeWidth: 2 },
      },
      {
        id: "e-reserve-provision",
        source: "reserve_inventory",
        target: "provision_network",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563EB" },
        style: { stroke: "#2563EB", strokeWidth: 2 },
      },
      {
        id: "e-provision-verify",
        source: "provision_network",
        target: "verify_service",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563EB" },
        style: { stroke: "#2563EB", strokeWidth: 2 },
      },
      {
        id: "e-verify-charging",
        source: "verify_service",
        target: "start_billing",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563EB" },
        style: { stroke: "#2563EB", strokeWidth: 2 },
      },
      {
        id: "e-billing-charging",
        source: "create_billing_account",
        target: "start_billing",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563EB" },
        style: { stroke: "#2563EB", strokeWidth: 2 },
      },
      {
        id: "e-charging-deprovision",
        source: "start_billing",
        target: "deprovision_network",
        type: "smoothstep",
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#ED2C2C" },
        style: { stroke: "#ED2C2C", strokeWidth: 2.5, strokeDasharray: "4 4" },
      },
      {
        id: "e-deprovision-release",
        source: "deprovision_network",
        target: "release_inventory",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#8B7B65" },
        style: { stroke: "#8B7B65", strokeWidth: 2, strokeDasharray: "3 3" },
      },
      {
        id: "e-release-void",
        source: "release_inventory",
        target: "void_billing_account",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#8B7B65" },
        style: { stroke: "#8B7B65", strokeWidth: 2, strokeDasharray: "3 3" },
      },
      {
        id: "e-void-notify",
        source: "void_billing_account",
        target: "notify_customer",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#E2E8F0" },
        style: { stroke: "#E2E8F0", strokeWidth: 2, strokeDasharray: "3 3" },
      },
    ];
  }, [tasks, isResolved]);

  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(computeEdges());

  // Sync node and edge data updates when tasks, resolution, or selection changes
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const freshNodes = getInitialNodes();
      setNodes((currentNodes) => {
        const curMap = new Map(currentNodes.map((n) => [n.id, n]));
        return freshNodes.map((fresh) => {
          const existing = curMap.get(fresh.id);
          return {
            ...fresh,
            // Retain user dragged position if node was already dragged
            position: existing ? existing.position : fresh.position,
            data: {
              ...fresh.data,
              isSelected: selectedTaskId === fresh.id,
            },
          };
        });
      });
      // Synchronize dynamic edges
      setEdges(computeEdges());
    } else {
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const isSelected = selectedTaskId === node.id;
          if (node.id === "deprovision_network") {
            return {
              ...node,
              data: {
                ...node.data,
                isSelected,
                status: isResolved ? "RESOLVED" : "FAILED",
                metaLeft: isResolved ? "Operator Over..." : "504 Gateway...",
                metaRight: isResolved ? "Done" : "5.94s",
                badgeText: isResolved ? "NOC" : "5× Fail",
                badgeStyle: isResolved ? "noc" : "failed",
                isResolved,
              },
            };
          }
          if (node.id === "start_billing") {
            return {
              ...node,
              data: {
                ...node.data,
                isSelected,
                status: chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "RESOLVED" : "FAILED",
                metaLeft: chargingStatus === "ROLLED_BACK" ? "Rolled Back" : chargingStatus === "UNDONE" ? "Request Undone" : "OCS 500: Time...",
                metaRight: chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "Restored" : "3.00s",
                badgeText: chargingStatus === "ROLLED_BACK" ? "ROLLED_BACK" : chargingStatus === "UNDONE" ? "UNDONE" : "×3",
                badgeStyle: chargingStatus === "ROLLED_BACK" || chargingStatus === "UNDONE" ? "noc" : "attempt",
              },
            };
          }
          return {
            ...node,
            data: {
              ...node.data,
              isSelected,
            },
          };
        })
      );
      setEdges(computeEdges());
    }
  }, [tasks, isResolved, selectedTaskId, chargingStatus, getInitialNodes, computeEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, color: "#0A1B2E" },
            style: { stroke: "#0A1B2E", strokeWidth: 2 },
          },
          eds
        )
      ),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectTask(node.id);
    },
    [onSelectTask]
  );

  return (
    <div className="w-full h-full min-h-[580px] relative select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        {dagGrid && (
          <Background
            color="#CBD5E1"
            gap={20}
            size={1.5}
            bgColor="#FFFFFF"
          />
        )}
        <Controls
          showInteractive={false}
          className="!bg-white !border !border-[#CBD5E1] !rounded-lg !shadow-xs overflow-hidden [&>button]:!border-b [&>button]:!border-[#E2E8F0] [&>button]:!bg-white [&>button]:hover:!bg-[#F8FAFC]"
        />
        {dagMinimap && (
          <MiniMap
            zoomable
            pannable
            className="!bg-white/95 !border !border-[#CBD5E1] !rounded-lg !shadow-md !m-4"
            nodeColor={(node) => {
              if (node.id === "deprovision_network") return isResolved ? "#0A1B2E" : "#DC2626";
              if (node.id === "start_billing") return "#DC2626";
              if (node.id === "release_inventory" || node.id === "void_billing_account") return "#94A3B8";
              return "#0A1B2E";
            }}
            nodeStrokeWidth={2}
          />
        )}
      </ReactFlow>

      {/* Floating Interactive Guide Pill */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs border border-[#CBD5E1] rounded-full px-3 py-1 shadow-xs pointer-events-none flex items-center gap-2 text-[11px] font-mono text-[#0A1B2E]">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Interactive Canvas · Drag nodes to restructure · Connect handles</span>
      </div>
    </div>
  );
}
