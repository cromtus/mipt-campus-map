type SnapLine = {
  from: { x: number; y: number },
  to: { x: number; y: number }
}

export function snapPosition(
    endPoint: { x: number; y: number } | null,
    isCtrlPressed: boolean,
    allPoints: number[][]
  ) {
    if (endPoint == null) {
      return null
    }

    let snappedX = endPoint.x;
    let snappedY = endPoint.y;
    let snapLines: { x?: SnapLine, y?: SnapLine } = {};

    if (isCtrlPressed) {
      const snapThreshold = 3;
      
      for (const point of allPoints) {
        if (Math.abs(point[0] - endPoint.x) < snapThreshold && (snapLines.x === undefined || Math.abs(point[1] - endPoint.y) < Math.abs(snapLines.x.from.y - snapLines.x.to.y))) {
          snappedX = point[0];
          snapLines.x = {
            from: { x: point[0], y: point[1] },
            to: { x: snappedX, y: endPoint.y }
          };
        }
        if (Math.abs(point[1] - endPoint.y) < snapThreshold && (snapLines.y === undefined || Math.abs(point[0] - endPoint.x) < Math.abs(snapLines.y.from.x - snapLines.y.to.x))) {
          snappedY = point[1];
          snapLines.y = {
            from: { x: point[0], y: point[1] },
            to: { x: endPoint.x, y: snappedY }
          };
        }
      }
    }

    if (snapLines.x !== undefined) {
      snapLines.x.to.y = snappedY;
    }
    if (snapLines.y !== undefined) {
      snapLines.y.to.x = snappedX;
    }

    return {
      snapped: { x: snappedX, y: snappedY },
      snapLines: Object.values(snapLines)
    };
  }