// Workflow Flowchart — React Flow (UMD, no JSX)
// Two paths: Client-Directed vs Concept-First
// Animated reveal when slide becomes active

(function () {
    'use strict';

    // ═══════════════════════════════════════════════
    // NODE DEFINITIONS — Two Paths
    // ═══════════════════════════════════════════════

    var NODES = [
        // Pre-entry — Sales (lateral, left of main flow)
        { id: 'sales', label: 'Sales & Outreach', subtitle: 'Pitching to new clients & internal teams', color: '#60a5fa', type: 'sales', x: -120, y: 0 },

        // Entry
        { id: 'client', label: 'Client Brief', subtitle: 'The project starts here', color: '#d8ff85', type: 'start', x: 400, y: 0 },

        // Path split
        { id: 'knows', label: 'Clear Scope', subtitle: 'Client knows what they want', color: '#4ade80', type: 'path-a', x: 170, y: 115 },
        { id: 'explore', label: 'Open Brief', subtitle: 'Client needs direction', color: '#818CF8', type: 'path-b', x: 630, y: 115 },

        // Path A — Direct
        { id: 'scope-a', label: 'Technical Scoping', subtitle: 'Define specs, timeline & budget', color: '#4ade80', type: 'path-a', x: 170, y: 220 },

        // Path B — Concept
        { id: 'concept', label: 'Concept Development', subtitle: 'We ideate & propose options', color: '#818CF8', type: 'path-b', x: 630, y: 220 },
        { id: 'pitch', label: 'Pitch & Align', subtitle: 'Present ideas, refine with client', color: '#818CF8', type: 'path-b', x: 630, y: 325 },

        // PoC
        { id: 'poc', label: 'Prototype / PoC', subtitle: 'Quick test to validate feasibility', color: '#e879f9', type: 'merge', x: 400, y: 410 },

        // Production
        { id: 'production', label: 'Production', subtitle: 'Iterative — client approvals at milestones', color: '#f59e0b', type: 'merge', x: 400, y: 510 },
        { id: 'dev', label: 'Development & QA', subtitle: 'Build, test, iterate with feedback loops', color: '#f59e0b', type: 'merge', x: 400, y: 610 },

        // Delivery
        { id: 'delivery', label: 'Delivery & Launch', subtitle: 'Handoff, publish, integrate', color: '#d8ff85', type: 'end', x: 400, y: 710 },
        { id: 'event', label: 'Event Support', subtitle: 'On-site deploy, run & assist', color: '#FF6B35', type: 'end', x: 400, y: 810 },
    ];

    var EDGES = [
        // Sales feeds into Client Brief (horizontal)
        { source: 'sales', target: 'client', label: 'we generate the opportunity', sourceHandle: 'right', targetHandle: 'left' },
        // Split
        { source: 'client', target: 'knows', label: 'clear scope' },
        { source: 'client', target: 'explore', label: 'needs ideas' },
        // Path A
        { source: 'knows', target: 'scope-a', label: '' },
        { source: 'scope-a', target: 'poc', label: '' },
        // Path B
        { source: 'explore', target: 'concept', label: '' },
        { source: 'concept', target: 'pitch', label: '' },
        { source: 'pitch', target: 'poc', label: '' },
        // Merge → Production → Delivery
        { source: 'poc', target: 'production', label: 'validated' },
        { source: 'production', target: 'dev', label: '' },
        { source: 'dev', target: 'delivery', label: '' },
        { source: 'delivery', target: 'event', label: 'if needed', dashed: true },
    ];

    // Filter groups
    var FILTERS = [
        { id: 'path-a', label: 'Client-Directed', desc: 'Clear brief → prototype → production', nodes: ['client', 'knows', 'scope-a', 'poc', 'production', 'dev', 'delivery', 'event'], color: '#4ade80' },
        { id: 'path-b', label: 'Concept-First', desc: 'We propose ideas → validate → build', nodes: ['client', 'explore', 'concept', 'pitch', 'poc', 'production', 'dev', 'delivery', 'event'], color: '#818CF8' },
        { id: 'sales', label: 'Sales & BD', desc: 'How we generate new opportunities', nodes: ['sales', 'client', 'knows', 'explore', 'scope-a', 'concept', 'pitch'], color: '#60a5fa' },
        { id: 'full', label: 'Full Workflow', desc: 'Everything end-to-end', nodes: null, color: '#d8ff85' }, // null = show all
    ];

    // ═══════════════════════════════════════════════
    // WAIT FOR LIBS
    // ═══════════════════════════════════════════════

    function waitForLibs(cb) {
        var t = setInterval(function () {
            if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined' && typeof ReactFlow !== 'undefined') {
                clearInterval(t);
                cb();
            }
        }, 100);
    }

    waitForLibs(function () {
        var useState = React.useState;
        var useCallback = React.useCallback;
        var useEffect = React.useEffect;
        var useMemo = React.useMemo;
        var useRef = React.useRef;
        var RF = ReactFlow;
        var h = React.createElement;

        // ─── Custom Node ───
        function WorkflowNode(props) {
            var d = props.data;
            var isStart = d.type === 'start';
            var isEnd = d.type === 'end';
            var isMerge = d.type === 'merge';
            var isSales = d.type === 'sales';

            var bg = isStart ? d.color : isSales ? (d.color + '20') : (d.color + '18');
            var borderStyle = isSales ? '2px dashed ' + d.color : '2px solid ' + d.color;
            var textColor = isStart ? '#0f1f1a' : '#f7f9f2';
            var radius = isStart || isSales ? '28px' : isEnd ? '28px' : '14px';
            var minW = isStart || isEnd ? '200px' : isMerge ? '200px' : isSales ? '190px' : '180px';

            var style = {
                padding: '14px 22px',
                borderRadius: radius,
                background: bg,
                border: borderStyle,
                color: textColor,
                minWidth: minW,
                textAlign: 'center',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 24px ' + d.color + '22',
                transition: 'all 0.3s ease',
            };

            var handleStyle = { background: d.color, width: 8, height: 8, border: 'none' };
            var handles = [];

            // Top target + Bottom source (default for all non-sales)
            if (!isSales) {
                handles.push(h(RF.Handle, { key: 'top', id: 'top', type: 'target', position: RF.Position.Top, style: handleStyle }));
            }
            // Left target on Client Brief (for horizontal Sales edge)
            if (isStart) {
                handles.push(h(RF.Handle, { key: 'left', id: 'left', type: 'target', position: RF.Position.Left, style: handleStyle }));
            }
            // Right source on Sales node
            if (isSales) {
                handles.push(h(RF.Handle, { key: 'right', id: 'right', type: 'source', position: RF.Position.Right, style: handleStyle }));
            }
            // Bottom source (for all except sales)
            if (!isSales) {
                handles.push(h(RF.Handle, { key: 'bottom', id: 'bottom', type: 'source', position: RF.Position.Bottom, style: handleStyle }));
            }

            return h('div', { style: style },
                handles,
                h('div', { style: { fontWeight: isStart ? '700' : '600', fontSize: '14px', marginBottom: '4px', letterSpacing: '0.01em' } }, d.label),
                h('div', { style: { fontSize: '11px', opacity: 0.75, lineHeight: '1.35' } }, d.subtitle)
            );
        }

        var nodeTypes = { workflowNode: WorkflowNode };

        // ─── FlowChart ───
        function FlowChart(props) {
            var visibleIds = props.visibleIds;
            var focusIds = props.focusIds;

            var computed = useMemo(function () {
                var filteredNodes = NODES.filter(function (n) { return visibleIds.has(n.id); }).map(function (n) {
                    return {
                        id: n.id,
                        type: 'workflowNode',
                        position: { x: n.x - 90, y: n.y },
                        data: { label: n.label, subtitle: n.subtitle, color: n.color, type: n.type },
                    };
                });

                var filteredEdges = EDGES.filter(function (e) { return visibleIds.has(e.source) && visibleIds.has(e.target); }).map(function (e) {
                    var targetNode = NODES.find(function (n) { return n.id === e.target; });
                    var edgeObj = {
                        id: 'e-' + e.source + '-' + e.target,
                        source: e.source,
                        target: e.target,
                        animated: !e.dashed,
                        style: { stroke: targetNode ? targetNode.color : '#666', strokeWidth: 2, strokeDasharray: e.dashed ? '6,4' : 'none' },
                        label: e.label || undefined,
                        labelStyle: { fontSize: 10, fill: '#8a9a92', fontFamily: 'Inter Tight, sans-serif' },
                        labelBgStyle: { fill: '#0f1f1a', fillOpacity: 0.9 },
                    };
                    if (e.sourceHandle) edgeObj.sourceHandle = e.sourceHandle;
                    if (e.targetHandle) edgeObj.targetHandle = e.targetHandle;
                    return edgeObj;
                });

                return { nodes: filteredNodes, edges: filteredEdges };
            }, [visibleIds]);

            var nodesHook = RF.useNodesState(computed.nodes);
            var nodesState = nodesHook[0], setNodes = nodesHook[1], onNodesChange = nodesHook[2];
            var edgesHook = RF.useEdgesState(computed.edges);
            var edgesState = edgesHook[0], setEdges = edgesHook[1], onEdgesChange = edgesHook[2];
            var rfInstance = RF.useReactFlow();

            useEffect(function () {
                setNodes(computed.nodes);
                setEdges(computed.edges);
            }, [computed.nodes, computed.edges, setNodes, setEdges]);

            useEffect(function () {
                if (focusIds && focusIds.length > 0) {
                    setTimeout(function () {
                        rfInstance.fitView({ padding: 0.35, duration: 700, nodes: focusIds.map(function (id) { return { id: id }; }) });
                    }, 150);
                }
            }, [focusIds, rfInstance]);

            return h(RF.ReactFlow, {
                nodes: nodesState,
                edges: edgesState,
                onNodesChange: onNodesChange,
                onEdgesChange: onEdgesChange,
                nodeTypes: nodeTypes,
                fitView: true,
                fitViewOptions: { padding: 0.25, duration: 700 },
                proOptions: { hideAttribution: true },
                style: { background: 'transparent' },
                nodesDraggable: false,
                nodesConnectable: false,
                elementsSelectable: false,
                panOnDrag: true,
                zoomOnScroll: true,
                zoomOnPinch: true,
                minZoom: 0.4,
                maxZoom: 1.8,
            },
                h(RF.Background, { color: '#2a4a3a', gap: 28, variant: 'dots', size: 1 })
            );
        }

        // ─── App ───
        // Exposed controls so the MutationObserver can drive the first-entry intro
        var _playIntroSequence = null;
        var _cancelIntroSequence = null;

        function WorkflowApp() {
            var filterState = useState('sales');
            var activeFilter = filterState[0];
            var setActiveFilter = filterState[1];
            var focusState = useState(null);
            var focusIds = focusState[0];
            var setFocusIds = focusState[1];
            var introTimersRef = useRef([]);

            var clearIntroTimers = useCallback(function () {
                introTimersRef.current.forEach(function (timerId) {
                    clearTimeout(timerId);
                });
                introTimersRef.current = [];
            }, []);

            var visibleIds = useMemo(function () {
                var filter = FILTERS.find(function (f) { return f.id === activeFilter; });
                if (!filter || !filter.nodes) {
                    // Show all
                    var all = new Set();
                    NODES.forEach(function (n) { all.add(n.id); });
                    return all;
                }
                return new Set(filter.nodes);
            }, [activeFilter]);

            var selectFilter = useCallback(function (id) {
                setActiveFilter(id);
                var filter = FILTERS.find(function (f) { return f.id === id; });
                if (filter && filter.nodes) {
                    setFocusIds(filter.nodes);
                } else {
                    setFocusIds(null);
                }
            }, []);

            _cancelIntroSequence = clearIntroTimers;

            _playIntroSequence = useCallback(function () {
                clearIntroTimers();

                var sequence = ['path-a', 'path-b', 'sales'];
                sequence.forEach(function (id, index) {
                    var timerId = setTimeout(function () {
                        selectFilter(id);
                    }, 450 + (index * 900));
                    introTimersRef.current.push(timerId);
                });
            }, [clearIntroTimers, selectFilter]);

            useEffect(function () {
                return function () {
                    clearIntroTimers();
                    _cancelIntroSequence = null;
                    _playIntroSequence = null;
                };
            }, [clearIntroTimers]);

            // Filter buttons
            var buttons = FILTERS.map(function (f) {
                var isActive = activeFilter === f.id;
                return h('button', {
                    key: f.id,
                    onClick: function () { selectFilter(f.id); },
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '3px',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        border: isActive ? '2px solid ' + f.color : '1px solid rgba(216,255,133,0.15)',
                        background: isActive ? f.color + '18' : 'rgba(216,255,133,0.03)',
                        color: isActive ? f.color : 'rgba(247,249,242,0.5)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.25s ease',
                        fontFamily: 'Inter Tight, sans-serif',
                        flex: '1',
                        minWidth: '160px',
                    }
                },
                    h('span', { style: { fontSize: '14px' } }, f.label),
                    h('span', { style: { fontSize: '11px', fontWeight: '400', opacity: 0.7 } }, f.desc)
                );
            });

            return h('div', {
                style: { display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' },
                onClick: function (e) { e.stopPropagation(); }
            },
                // Filter row
                h('div', {
                    style: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }
                }, buttons),
                // Chart
                h('div', {
                    style: { flex: 1, minHeight: '380px', borderRadius: '16px', overflow: 'hidden', background: 'rgba(216,255,133,0.02)', border: '1px solid rgba(216,255,133,0.08)' }
                },
                    h(RF.ReactFlowProvider, null,
                        h(FlowChart, { visibleIds: visibleIds, focusIds: focusIds })
                    )
                )
            );
        }

        // ─── Mount ───
        var root = document.getElementById('workflow-root');
        if (root) {
            root.style.height = '100%';
            root.style.background = 'transparent';
            ReactDOM.render(h(WorkflowApp), root);

            // Run the filter intro only the first time the workflow slide becomes active
            var slide = document.getElementById('slide-workflow');
            if (slide) {
                var wasActive = false;
                var hasPlayedIntro = false;
                new MutationObserver(function () {
                    var isActive = slide.classList.contains('active');
                    if (isActive && !wasActive && !hasPlayedIntro && _playIntroSequence) {
                        hasPlayedIntro = true;
                        _playIntroSequence();
                    }
                    if (!isActive && wasActive && _cancelIntroSequence) {
                        _cancelIntroSequence();
                    }
                    wasActive = isActive;
                }).observe(slide, { attributes: true, attributeFilter: ['class'] });
            }
        }
    });
})();
