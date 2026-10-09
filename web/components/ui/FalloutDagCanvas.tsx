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

interface FalloutDagCanvasProps {
  activeDagNode: string;
  onSelectNode: (nodeId: string) => void;
  isResolved?: boolean;
}

export function FalloutDagCanvas({
  activeDagNode,
  onSelectNode,
  isResolved = false,
}: FalloutDagCanvasProps) {
  const getInitialNodes = useCallback((): Node<DagNodeData>[] => {
    return [
      // Forward Wave Nodes
      {
        id: "forward-validate",
        type: "customDagNode",
        position: { x: 30, y: 50 },
        data: {
          taskId: "forward-validate",
          system: "OMS:8101",
          name: "Validate Order",
          metaLeft: "Latency",
          metaRight: "220ms",
          status: "SUCCEEDED",
          isSelected: activeDagNode === "forward-validate",
        },
      },
      {
        id: "forward-inventory",
        type: "customDagNode",
        position: { x: 250, y: 15 },
        data: {
          taskId: "forward-inventory",
          system: "SIM_INV:8102",
          name: "Reserve Inventory",
          metaLeft: "Branch A",
          metaRight: "PASS",
          status: "SUCCEEDED",
          isSelected: activeDagNode === "forward-inventory",
        },
      },
      {
        id: "forward-billing",
        type: "customDagNode",
        position: { x: 250, y: 105 },
        data: {
          taskId: "forward-billing",
          system: "OCS:8104",
          name: "Create Billing",
          metaLeft: "Branch B",
          metaRight: "PASS",
          status: "SUCCEEDED",
          isSelected: activeDagNode === "forward-billing",
        },
      },
      {
        id: "forward-network",
        type: "customDagNode",
        position: { x: 470, y: 50 },
        data: {
          taskId: "forward-network",
          system: "HLR:8103",
          name: "Provision Network",
          metaLeft: "Latency",
          metaRight: "1.42s",
          status: "SUCCEEDED",
          isSelected: activeDagNode === "forward-network",
        },
      },
      {
        id: "forward-charging",
        type: "customDagNode",
        position: { x: 690, y: 50 },
        data: {
          taskId: "forward-charging",
          system: "OCS:8104",
          name: "Start Charging",
          metaLeft: "Rating Timeout",
          metaRight: "ERR 500",
          status: "FAILED",
          badgeText: "ERR 500",
          badgeStyle: "failed",
          isSelected: activeDagNode === "forward-charging",
        },
      },

      // Rollback Wave Nodes
      {
        id: "rollback-deprovision",
        type: "customDagNode",
        position: { x: 470, y: 220 },
        data: {
          taskId: "rollback-deprovision",
          system: "HLR:8103",
          name: "Deprovision Network",
          metaLeft: isResolved ? "NOC Override" : "Retries",
          metaRight: isResolved ? "Done" : "5/5 Failed",
          status: isResolved ? "RESOLVED" : "FAILED",
          badgeText: isResolved ? "NOC" : "EXHAUSTED",
          badgeStyle: isResolved ? "noc" : "failed",
          isResolved: isResolved,
          isSelected: activeDagNode === "rollback-deprovision",
        },
      },
      {
        id: "rollback-inventory",
        type: "customDagNode",
        position: { x: 250, y: 220 },
        data: {
          taskId: "rollback-inventory",
          system: "SIM_INV:8102",
          name: "Release Inventory",
          metaLeft: isResolved ? "Queued / Ready" : "Waiting on HLR",
          metaRight: isResolved ? "READY" : "STALLED",
          status: "STALLED",
          isStalled: !isResolved,
          isSelected: activeDagNode === "rollback-inventory",
        },
      },
      {
        id: "rollback-billing",
        type: "customDagNode",
        position: { x: 30, y: 220 },
        data: {
          taskId: "rollback-billing",
          system: "OCS:8104",
          name: "Void Billing Acct",
          metaLeft: isResolved ? "Queued / Ready" : "Waiting on HLR",
          metaRight: isResolved ? "READY" : "STALLED",
          status: "STALLED",
          isStalled: !isResolved,
          isSelected: activeDagNode === "rollback-billing",
        },
      },
    ];
  }, [activeDagNode, isResolved]);

  const initialEdges: Edge[] = useMemo(
    () => [
      // Forward Flow
      {
        id: "e-fwd-val-inv",
        source: "forward-validate",
        target: "forward-inventory",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563EB" },
        style: { stroke: "#2563EB", strokeWidth: 2 },
      },
      {
        id: "e-fwd-val-bill",
        source: "forward-validate",
        target: "forward-billing",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563EB" },
        style: { stroke: "#2563EB", strokeWidth: 2 },
      },
      {
        id: "e-fwd-inv-net",
        source: "forward-inventory",
        target: "forward-network",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563EB" },
        style: { stroke: "#2563EB", strokeWidth: 2 },
      },
      {
        id: "e-fwd-bill-net",
        source: "forward-billing",
        target: "forward-network",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563EB" },
        style: { stroke: "#2563EB", strokeWidth: 2 },
      },
      {
        id: "e-fwd-net-charge",
        source: "forward-network",
        target: "forward-charging",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563EB" },
        style: { stroke: "#2563EB", strokeWidth: 2 },
      },

      // Forward Failure -> Rollback Trigger
      {
        id: "e-charge-rollback",
        source: "forward-charging",
        target: "rollback-deprovision",
        type: "smoothstep",
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#ED2C2C" },
        style: { stroke: "#ED2C2C", strokeWidth: 2.5, strokeDasharray: "4 4" },
      },

      // Rollback Cascade
      {
        id: "e-rollback-dep-inv",
        source: "rollback-deprovision",
        target: "rollback-inventory",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#8B7B65" },
        style: { stroke: "#8B7B65", strokeWidth: 2, strokeDasharray: "3 3" },
      },
      {
        id: "e-rollback-inv-bill",
        source: "rollback-inventory",
        target: "rollback-billing",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#8B7B65" },
        style: { stroke: "#8B7B65", strokeWidth: 2, strokeDasharray: "3 3" },
      },
    ],
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync node changes when selection or resolution state updates
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const isSelected = activeDagNode === node.id;
        if (node.id === "rollback-deprovision") {
          return {
            ...node,
            data: {
              ...node.data,
              isSelected,
              status: isResolved ? "RESOLVED" : "FAILED",
              metaLeft: isResolved ? "NOC Override" : "Retries",
              metaRight: isResolved ? "Done" : "5/5 Failed",
              badgeText: isResolved ? "NOC" : "EXHAUSTED",
              badgeStyle: isResolved ? "noc" : "failed",
              isResolved,
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
  }, [activeDagNode, isResolved, setNodes]);

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
      onSelectNode(node.id);
    },
    [onSelectNode]
  );

  return (
    <div className="w-full h-[360px] relative select-none bg-white">
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
        minZoom={0.5}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#CBD5E1" gap={18} size={1.2} bgColor="#FFFFFF" />
        <Controls
          showInteractive={false}
          className="!bg-white !border !border-[#CBD5E1] !rounded-lg !shadow-xs overflow-hidden [&>button]:!border-b [&>button]:!border-[#E2E8F0] [&>button]:!bg-white [&>button]:hover:!bg-[#F8FAFC]"
        />
        <MiniMap
          zoomable
          pannable
          className="!bg-white/95 !border !border-[#CBD5E1] !rounded-lg !shadow-xs !m-3"
          nodeColor={(node) => {
            if (node.id === "rollback-deprovision") return isResolved ? "#0A1B2E" : "#DC2626";
            if (node.id === "forward-charging") return "#DC2626";
            if (node.id.startsWith("rollback-")) return "#94A3B8";
            return "#0A1B2E";
          }}
          nodeStrokeWidth={2}
        />
      </ReactFlow>

      {/* Interactive Helper Banner */}
      <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs border border-[#CBD5E1] rounded-full px-3 py-1 shadow-xs pointer-events-none flex items-center gap-2 text-[10px] font-mono text-[#0A1B2E]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Interactive Saga Canvas · Move tags · Restructure connections</span>
      </div>
    </div>
  );
}
