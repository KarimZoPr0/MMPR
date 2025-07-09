#!/usr/bin/env python3
"""
Generate walk network for Kista, Stockholm using OSMnx
Exports the network as JSON for use in the JavaScript simulation
"""

import osmnx as ox
import json
import os
from typing import Dict, List, Any
import networkx as nx

def download_kista_walk_network():
    """Download walkable network for Kista area"""
    print("Downloading walk network for Kista, Stockholm...")
    
    # Define Kista area (can be adjusted for different coverage)
    kista_bounds = {
        'north': 59.415,
        'south': 59.390,
        'east': 17.960,
        'west': 17.920
    }
    
    # Download walkable network
    G = ox.graph_from_bbox(
        north=kista_bounds['north'],
        south=kista_bounds['south'],
        east=kista_bounds['east'],
        west=kista_bounds['west'],
        network_type='walk',
        simplify=True,
        clean_periphery=True
    )
    
    print(f"Downloaded network with {len(G.nodes)} nodes and {len(G.edges)} edges")
    return G

def process_network_for_javascript(G: nx.MultiDiGraph) -> Dict[str, Any]:
    """Convert NetworkX graph to JavaScript-friendly format"""
    print("Processing network for JavaScript...")
    
    # Convert to undirected graph for pedestrian simulation
    G_undirected = G.to_undirected()
    
    # Extract nodes (intersections)
    nodes = {}
    for node_id, data in G_undirected.nodes(data=True):
        if 'y' in data and 'x' in data:  # OSMnx stores lat/lon as y/x
            nodes[str(node_id)] = {
                'id': str(node_id),
                'lat': float(data['y']),
                'lng': float(data['x']),
                'properties': {
                    'highway': data.get('highway', 'intersection'),
                    'name': data.get('name', ''),
                    'intersection': data.get('intersection', False)
                }
            }
    
    # Extract edges (walkable paths)
    edges = []
    for u, v, data in G_undirected.edges(data=True):
        if str(u) in nodes and str(v) in nodes:
            edge = {
                'id': f"edge_{u}_{v}",
                'from': str(u),
                'to': str(v),
                'coordinates': [
                    {'lat': nodes[str(u)]['lat'], 'lng': nodes[str(u)]['lng']},
                    {'lat': nodes[str(v)]['lat'], 'lng': nodes[str(v)]['lng']}
                ],
                'properties': {
                    'highway': data.get('highway', 'path'),
                    'name': data.get('name', ''),
                    'length': float(data.get('length', 0)),
                    'width': data.get('width', None),
                    'surface': data.get('surface', None),
                    'lit': data.get('lit', None),
                    'foot': data.get('foot', 'yes')
                }
            }
            edges.append(edge)
    
    # Create walkable areas from edges
    walkable_areas = []
    for edge in edges:
        walkable_areas.append({
            'id': edge['id'],
            'type': determine_area_type(edge['properties']),
            'coordinates': edge['coordinates'],
            'properties': edge['properties']
        })
    
    # Create graph structure for pathfinding
    graph = {}
    for node_id in nodes:
        graph[node_id] = []
    
    for edge in edges:
        graph[edge['from']].append({
            'to': edge['to'],
            'distance': edge['properties']['length'],
            'edge_id': edge['id']
        })
        graph[edge['to']].append({
            'to': edge['from'],
            'distance': edge['properties']['length'],
            'edge_id': edge['id']
        })
    
    return {
        'metadata': {
            'area': 'Kista, Stockholm',
            'bounds': {
                'north': 59.415,
                'south': 59.390,
                'east': 17.960,
                'west': 17.920
            },
            'node_count': len(nodes),
            'edge_count': len(edges),
            'generated_at': '2024-01-01T00:00:00Z'
        },
        'nodes': nodes,
        'edges': edges,
        'walkable_areas': walkable_areas,
        'graph': graph
    }

def determine_area_type(properties: Dict[str, Any]) -> str:
    """Determine the type of walkable area based on OSM properties"""
    highway = properties.get('highway', '')
    
    if highway == 'footway':
        return 'path'
    elif highway == 'pedestrian':
        return 'path'
    elif highway == 'living_street':
        return 'road'
    elif highway == 'residential' and properties.get('sidewalk'):
        return 'sidewalk'
    elif highway in ['primary', 'secondary', 'tertiary'] and properties.get('sidewalk'):
        return 'sidewalk'
    elif properties.get('leisure') == 'park':
        return 'plaza'
    else:
        return 'path'

def export_network(data: Dict[str, Any], output_dir: str = '../src/data'):
    """Export network data to JSON files"""
    print(f"Exporting network data to {output_dir}...")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Export full network data
    with open(os.path.join(output_dir, 'kista_walk_network.json'), 'w') as f:
        json.dump(data, f, indent=2)
    
    # Export just walkable areas (for backward compatibility)
    with open(os.path.join(output_dir, 'walkable_areas.json'), 'w') as f:
        json.dump(data['walkable_areas'], f, indent=2)
    
    # Export graph structure for pathfinding
    with open(os.path.join(output_dir, 'walk_graph.json'), 'w') as f:
        json.dump(data['graph'], f, indent=2)
    
    print(f"Exported {len(data['walkable_areas'])} walkable areas")
    print(f"Exported graph with {len(data['nodes'])} nodes")

def main():
    """Main function to generate walk network"""
    try:
        # Download network
        G = download_kista_walk_network()
        
        # Process for JavaScript
        network_data = process_network_for_javascript(G)
        
        # Export data
        export_network(network_data)
        
        print("✅ Walk network generation completed successfully!")
        print(f"📁 Data exported to src/data/")
        print(f"🗺️  Network covers {len(network_data['nodes'])} intersections")
        print(f"🚶 {len(network_data['walkable_areas'])} walkable paths")
        
    except Exception as e:
        print(f"❌ Error generating walk network: {e}")
        raise

if __name__ == "__main__":
    main() 