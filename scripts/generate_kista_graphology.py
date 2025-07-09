#!/usr/bin/env python3
"""
Generate Kista walk network in Graphology JSON format for use in TypeScript app.
"""
import osmnx as ox
import json
import os

print("Downloading walk network for Kista, Stockholm...")
G = ox.graph_from_point((59.4031236, 17.9424221), dist=500, network_type="walk")
print(f"Downloaded network with {len(G.nodes)} nodes and {len(G.edges)} edges")

def to_graphology_json(G):
    data = {
        "attributes": {},
        "nodes": [],
        "edges": []
    }
    for node, attrs in G.nodes(data=True):
        # Only keep lat/lng and useful tags
        node_attrs = {
            "lat": float(attrs['y']),
            "lng": float(attrs['x']),
            "highway": attrs.get('highway', 'intersection'),
            "name": attrs.get('name', '')
        }
        data["nodes"].append({"key": str(node), "attributes": node_attrs})
    
    # Use keys=True to get unique edge keys for MultiDiGraph
    edge_seen = set()
    for u, v, key, attrs in G.edges(keys=True, data=True):
        base_key = f"{u}-{v}-{key}"
        edge_key = base_key
        i = 1
        while edge_key in edge_seen:
            edge_key = f"{base_key}-{i}"
            i += 1
        edge_seen.add(edge_key)  # Add the final unique key
        
        edge_attrs = {
            "highway": attrs.get('highway', 'path'),
            "length": float(attrs.get('length', 0)),
            "surface": attrs.get('surface', ''),
            "foot": attrs.get('foot', 'yes')
        }
        data["edges"].append({
            "key": edge_key,
            "source": str(u),
            "target": str(v),
            "attributes": edge_attrs
        })
    return data

# Export to Graphology JSON
output_path = os.path.join(os.path.dirname(__file__), '../src/data/kista_walk_network.graphology.json')
output_path = os.path.abspath(output_path)
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w') as f:
    json.dump(to_graphology_json(G), f, indent=2)
print(f"Exported Graphology JSON to {output_path}")