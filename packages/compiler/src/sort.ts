import { Variable } from '@microsoft/chartifact-schema';

export function topologicalSort(list: Variable[]) {
    const nameToObject = new Map<string, Variable>();
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    for (const obj of list) {
        nameToObject.set(obj.variableId, obj);
        inDegree.set(obj.variableId, 0);
        graph.set(obj.variableId, []);
    }

    for (const obj of list) {
        const sources = obj.calculation?.dependsOn || [];

        for (const dep of sources) {
            if (!graph.has(dep)) {
                continue; // Skip if the dependency is not in the list
            }
            graph.get(dep)!.push(obj.variableId);
            inDegree.set(obj.variableId, inDegree.get(obj.variableId)! + 1);
        }
    }

    const queue: string[] = [];
    for (const [name, degree] of inDegree.entries()) {
        if (degree === 0) queue.push(name);
    }

    const sorted: Variable[] = [];
    while (queue.length) {
        const current = queue.shift()!;
        sorted.push(nameToObject.get(current)!);

        for (const neighbor of graph.get(current)!) {
            inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
            if (inDegree.get(neighbor) === 0) {
                queue.push(neighbor);
            }
        }
    }

    if (sorted.length !== list.length) {
        throw new Error("Cycle or missing dependency detected");
    }

    return sorted;
}
