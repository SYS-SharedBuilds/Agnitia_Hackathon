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

const nodeTypes = {
  customDagNode: InteractiveDagNode,
};

interface OrderDagProps {
  isResolved: boolean;
  selectedTaskId: string;
  onSelectTask: (taskId: string) => void;
  dagGrid: boolean;
  dagMinimap: boolean;
}

export function OrderDagCanvas({
  isResolved,
  selectedTaskId,
  onSelectTask,
  dagGrid,
  dagMinimap,
}: OrderDagProps) {
  const getInitialNodes = useCallback((): Node<DagNodeData>[] => {
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
          metaLeft: "Branch A",
          metaRight: "340ms",
          status: "SUCCEEDED",
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
          metaLeft: "hlr-east-01",
          metaRight: "1.42s",
          status: "SUCCEEDED",
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
          metaLeft: "Ping/Radius",
          metaRight: "610ms",
          status: "SUCCEEDED",
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
          metaLeft: "Branch B",
          metaRight: "420ms",
          status: "SUCCEEDED",
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
          metaLeft: "OCS 500: Time...",
          metaRight: "3.00s",
          status: "FAILED",
          badgeText: "×3",
          badgeStyle: "attempt",
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
  }, [isResolved, selectedTaskId]);

  const initialEdges: Edge[] = useMemo(
    () => [
      // Forward Execution Wave 1 -> Wave 2
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
      // Branch A Pipeline
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
      // Branch Convergence to Start Charging
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
      // Saga Compensation Rollback Cascade
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
    ],
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync node data updates (e.g. selection or resolution status) while keeping moved positions intact
  useEffect(() => {
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
              tooltipTitle: isResolved
                ? "Rollback Completed: Operator Override Applied"
                : "Rollback Stalled: Deprovision Network Failed",
              tooltipText: isResolved
                ? "HLR Profile purged manually via NOC override ticket. Subsequent rollbacks and tombstone records verified."
                : "Compensation halted at Deprovision Network (5 retries exhausted). Subsequent rollbacks Release Inventory (WAITING) and Void Billing (WAITING) are paused until operator resolves.",
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
  }, [isResolved, selectedTaskId, setNodes]);

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
    <div className="w-full h-full relative select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
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
        <span>Interactive Canvas · Drag tags to restructure · Connect handles</span>
      </div>
    </div>
  );
}
