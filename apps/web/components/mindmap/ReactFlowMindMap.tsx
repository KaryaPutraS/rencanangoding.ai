"use client";

import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
  Handle,
  ReactFlowProvider,
  useReactFlow
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FeatureNode, TaskItem } from "@rencanangoding/shared";
import { Layers, ChevronDown, ChevronRight, Zap, Terminal, Code2, ShieldCheck, ZoomIn, ZoomOut, Maximize2, Sparkles, MapPin } from "lucide-react";

interface MindMapProps {
  planName: string;
  features: FeatureNode[];
  tasks?: TaskItem[];
  showTasks?: boolean;
  onGenerateRequested?: () => void;
}

// Custom Node for Root Idea (Obsidian Technical Theme)
function RootNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-5 py-4 rounded-2xl bg-gray-950/95 text-white font-bold text-xs shadow-2xl border border-emerald-500/60 max-w-[260px] text-center backdrop-blur-md">
      <div className="flex items-center justify-center gap-1.5 mb-1.5 text-[9px] font-mono text-emerald-400 uppercase tracking-widest">
        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
        <span>SYSTEM ROOT // APP SPECS</span>
      </div>
      <div className="text-sm text-white font-extrabold leading-snug truncate">{data.label}</div>
      <Handle type="source" position={Position.Right} className="!bg-emerald-400 !w-3 !h-3 !-right-1.5 border-2 border-gray-950" />
    </div>
  );
}

// Custom Node for Phase / Feature
function FeatureCustomNode({ data }: { data: { label: string; phase: number; subCount: number } }) {
  return (
    <div className="px-4 py-3.5 rounded-2xl bg-gray-950/95 border border-white/[0.12] text-gray-100 min-w-[260px] max-w-[300px] shadow-2xl backdrop-blur-md hover:border-emerald-500/50 transition-all">
      <Handle type="target" position={Position.Left} className="!bg-emerald-400 !w-3 !h-3 !-left-1.5 border-2 border-gray-950" />
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
          PHASE 0{data.phase}
        </span>
        <span className="text-[10px] font-mono text-gray-400">{data.subCount} SUB-FITUR</span>
      </div>
      <div className="font-bold text-xs sm:text-sm text-gray-100 leading-snug">{data.label}</div>
      <Handle type="source" position={Position.Right} className="!bg-cyan-400 !w-3 !h-3 !-right-1.5 border-2 border-gray-950" />
    </div>
  );
}

// Custom Node for SubFeature
function SubFeatureCustomNode({ data }: { data: { label: string; description: string; tasks?: TaskItem[] } }) {
  const [expanded, setExpanded] = React.useState(false);
  const taskCount = data.tasks?.length || 0;

  return (
    <div className="px-4 py-3 rounded-xl bg-gray-900/95 border border-white/[0.08] text-gray-200 min-w-[250px] max-w-[300px] shadow-xl hover:border-cyan-500/50 transition-all">
      <Handle type="target" position={Position.Left} className="!bg-cyan-400 !w-2.5 !h-2.5 !-left-1.5 border-2 border-gray-950" />
      <div className="font-bold text-xs text-cyan-300 mb-1 flex items-center justify-between gap-2 font-mono">
        <span className="truncate">{data.label}</span>
        {taskCount > 0 && (
          <span className="px-2 py-0.5 rounded text-[9px] bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60">
            {taskCount} task
          </span>
        )}
      </div>
      <p className={`text-[11px] text-gray-300 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
        {data.description}
      </p>
      {data.description && data.description.length > 45 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-0.5"
        >
          {expanded ? "Ringkas" : "Selengkapnya"}
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      )}
      <Handle type="source" position={Position.Right} className="!bg-amber-400 !w-2.5 !h-2.5 !-right-1.5 border-2 border-gray-950" />
    </div>
  );
}

// Custom Node for Task
function TaskCustomNode({ data }: { data: { ref: string; title: string; layer: string; status: string } }) {
  const isFrontend = data.layer === "frontend";

  return (
    <div className="px-3.5 py-2.5 rounded-xl bg-gray-950/95 border border-white/[0.08] text-gray-300 text-xs min-w-[200px] max-w-[240px] shadow-md hover:border-amber-500/50 transition-all">
      <Handle type="target" position={Position.Left} className="!bg-amber-400 !w-2 !h-2 !-left-1 border border-gray-950" />
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] font-bold text-amber-300">{data.ref}</span>
        <span
          className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded uppercase ${
            isFrontend ? "bg-cyan-950 text-cyan-300 border border-cyan-800/50" : "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
          }`}
        >
          {data.layer}
        </span>
      </div>
      <div className="font-medium text-gray-200 line-clamp-1 text-[11px]">{data.title}</div>
    </div>
  );
}

const nodeTypes = {
  rootNode: RootNode,
  featureNode: FeatureCustomNode,
  subFeatureNode: SubFeatureCustomNode,
  taskNode: TaskCustomNode
};

// Custom Bottom Right Control Panel & Legend
function MindMapControlWidget({ totalFeatures, totalSubFeatures }: { totalFeatures: number; totalSubFeatures: number }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-20 md:bottom-4 right-3 sm:right-4 z-30 flex flex-col items-end gap-2.5 pointer-events-auto">
      {/* Sleek Technical Legend & Stats Card */}
      <div className="tech-panel p-3 sm:p-3.5 rounded-2xl border border-white/[0.1] shadow-2xl space-y-2 backdrop-blur-md text-xs font-mono max-w-[240px] sm:max-w-none">
        <div className="flex items-center justify-between gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider pb-1.5 border-b border-white/[0.08]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Sparkles className="w-3 h-3" />
            <span>PETUNJUK MIND MAP</span>
          </span>
          <span className="text-gray-300 font-bold">{totalFeatures} Fase • {totalSubFeatures} Sub</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">Root</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
            <span className="truncate">Fase</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="truncate">Sub-Fitur</span>
          </div>
        </div>
      </div>

      {/* Floating Zoom & Canvas Controls */}
      <div className="flex items-center gap-1.5 tech-panel p-1.5 rounded-xl border border-white/[0.1] shadow-2xl backdrop-blur-md">
        <button
          onClick={() => zoomIn()}
          title="Zoom In / Perbesar"
          className="p-2.5 sm:p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <ZoomIn className="w-4 h-4 text-emerald-400" />
        </button>
        <button
          onClick={() => zoomOut()}
          title="Zoom Out / Perkecil"
          className="p-2.5 sm:p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <ZoomOut className="w-4 h-4 text-cyan-400" />
        </button>
        <button
          onClick={() => fitView({ padding: 0.2 })}
          title="Fit View / Reset Tampilan"
          className="p-2.5 sm:p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <Maximize2 className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
}

function FlowContent({ planName, features, tasks = [], showTasks = true, onGenerateRequested }: MindMapProps) {
  const { nodes, edges, totalFeatures, totalSubFeatures } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    let subCountTotal = 0;
    features.forEach((f) => {
      subCountTotal += Math.max(1, (f.subFeatures || []).length);
    });

    const ROW_GAP = 135;
    const totalHeight = subCountTotal * ROW_GAP;
    let currentY = -totalHeight / 2;

    // Root Node
    generatedNodes.push({
      id: "root",
      type: "rootNode",
      position: { x: 0, y: 0 },
      data: { label: planName }
    });

    // Features
    features.forEach((feature) => {
      const subFeatures = feature.subFeatures || [];
      const featureHeight = Math.max(1, subFeatures.length) * ROW_GAP;
      const featureCenterY = currentY + featureHeight / 2;

      const featureNodeId = `feat-${feature.id}`;
      generatedNodes.push({
        id: featureNodeId,
        type: "featureNode",
        position: { x: 340, y: featureCenterY - 30 },
        data: {
          label: feature.name || (feature as any).title || "Feature",
          phase: feature.phase || 1,
          subCount: subFeatures.length
        }
      });

      generatedEdges.push({
        id: `edge-root-${featureNodeId}`,
        source: "root",
        target: featureNodeId,
        type: "default",
        animated: true,
        style: { stroke: "#10B981", strokeWidth: 2 }
      });

      // SubFeatures
      subFeatures.forEach((sub, subIdx) => {
        const subY = currentY + subIdx * ROW_GAP;
        const subNodeId = `sub-${feature.id}-${subIdx}`;

        const subTitle = sub.name || (sub as any).title || "SubFeature";
        const relatedTasks = tasks.filter(
          (t) => (Boolean(sub.id) && t.subFeatureId === sub.id) || (t.title && subTitle && t.title.toLowerCase().includes(subTitle.toLowerCase()))
        );

        generatedNodes.push({
          id: subNodeId,
          type: "subFeatureNode",
          position: { x: 720, y: subY },
          data: {
            label: subTitle,
            description: sub.description,
            tasks: relatedTasks
          }
        });

        generatedEdges.push({
          id: `edge-${featureNodeId}-${subNodeId}`,
          source: featureNodeId,
          target: subNodeId,
          type: "default",
          style: { stroke: "#06B6D4", strokeWidth: 1.5 }
        });

        // Tasks Breakdown Nodes
        if (showTasks && relatedTasks.length > 0) {
          relatedTasks.forEach((task, tIdx) => {
            const taskNodeId = `task-${subNodeId}-${task.id || tIdx}`;
            const taskY = subY + (tIdx - (relatedTasks.length - 1) / 2) * 55;

            generatedNodes.push({
              id: taskNodeId,
              type: "taskNode",
              position: { x: 1080, y: taskY },
              data: {
                ref: task.ref,
                title: task.title,
                layer: task.layer,
                status: task.status
              }
            });

            generatedEdges.push({
              id: `edge-${subNodeId}-${taskNodeId}`,
              source: subNodeId,
              target: taskNodeId,
              type: "default",
              style: { stroke: "#F59E0B", strokeWidth: 1, strokeDasharray: "4 4" }
            });
          });
        }
      });

      currentY += featureHeight;
    });

    return {
      nodes: generatedNodes,
      edges: generatedEdges,
      totalFeatures: features.length,
      totalSubFeatures: subCountTotal
    };
  }, [planName, features, tasks, showTasks]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-dot-grid border border-white/[0.08]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={1.5}
        panOnDrag={true}
        preventScrolling={false}
        className="w-full h-full"
      >
        <Background color="#1E293B" gap={24} size={1} />
        <MindMapControlWidget totalFeatures={totalFeatures} totalSubFeatures={totalSubFeatures} />
      </ReactFlow>
    </div>
  );
}

export function ReactFlowMindMap(props: MindMapProps) {
  return (
    <ReactFlowProvider>
      <FlowContent {...props} />
    </ReactFlowProvider>
  );
}
