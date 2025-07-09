// Web Worker for pathfinding computations
importScripts('https://unpkg.com/graphology@0.25.4/dist/graphology.umd.js');
importScripts('https://unpkg.com/graphology-shortest-path@0.2.1/dist/graphology-shortest-path.umd.js');

const { singleSource } = graphologyShortestPath;

self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'COMPUTE_PATHS':
      computeAllPaths(data);
      break;
    case 'COMPUTE_SINGLE_PATH':
      computeSinglePath(data);
      break;
  }
};

function computeAllPaths(data) {
  const { graphData, nodes, progressCallback } = data;
  
  // Create graph from data
  const graph = new graphology.Graph({ multi: true });
  graph.import(graphData);
  
  const pathMatrix = {};
  const totalNodes = nodes.length;
  
  for (let i = 0; i < totalNodes; i++) {
    const source = nodes[i];
    const pathMapping = singleSource(graph, source);
    pathMatrix[source] = pathMapping;
    
    // Report progress every 10 nodes
    if (i % 10 === 0 || i === totalNodes - 1) {
      const progress = (i / totalNodes) * 100;
      self.postMessage({
        type: 'PROGRESS',
        progress: progress
      });
    }
  }
  
  self.postMessage({
    type: 'PATHS_COMPUTED',
    pathMatrix: pathMatrix
  });
}

function computeSinglePath(data) {
  const { graphData, source, target } = data;
  
  const graph = new graphology.Graph({ multi: true });
  graph.import(graphData);
  
  const pathMapping = singleSource(graph, source);
  const path = pathMapping[target] || [source];
  
  self.postMessage({
    type: 'SINGLE_PATH_COMPUTED',
    source: source,
    target: target,
    path: path
  });
} 