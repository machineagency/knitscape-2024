function pinchData(ev0, ev1) {
  // computes distance between two pointer events
  const dx = Math.abs(ev0.clientX - ev1.clientX);
  const dy = Math.abs(ev0.clientY - ev1.clientY);

  return {
    target: {
      x: Math.round(Math.min(ev0.clientX, ev1.clientX) + dx / 2),
      y: Math.round(Math.min(ev0.clientY, ev1.clientY) + dy / 2),
    },
    dist: Math.round(Math.hypot(dx, dy)),
  };
}

function eventPos(e) {
  return {
    x: e.clientX,
    y: e.clientY,
  };
}

function debuglog(msg) {
  document.getElementById("debug").innerHTML = `message: ${String(msg)}`;
}

export function dragPanZoom(element, callbacks, windowTracking = true) {
  const eventCache = [];
  let startPos = { x: -1, y: -1 };
  let prevDist = -1;
  let trackingEl = windowTracking ? window : element;
  let trackingPointerEvents = false;

  attachHandlers(element);

  function attachHandlers(el) {
    el.addEventListener("pointerdown", pointerdownHandler);
    el.addEventListener("wheel", wheelHandler);
  }

  function removeEvent(ev) {
    // Remove this event from the target's cache
    const index = eventCache.findIndex(
      (cachedEv) => cachedEv.pointerId === ev.pointerId
    );
    eventCache.splice(index, 1);
  }

  function pointerEnd(ev) {
    trackingEl.removeEventListener("pointermove", pointermoveHandler);

    // Remove this pointer from the cache and reset the target's
    // background and border
    removeEvent(ev);

    // If the number of pointers down is less than two then reset diff tracker
    if (eventCache.length == 1) {
      startPos = eventPos(eventCache[0]);
      prevDist = -1;
    }

    if (eventCache.length < 1) {
      // prevPinch = { target: { x: -1, y: -1 }, dist: -1 };
      startPos = { x: -1, y: -1 };

      trackingEl.removeEventListener("pointermove", pointermoveHandler);

      // remove pointer cancel events
      trackingEl.removeEventListener("pointerup", pointerEnd);
      trackingEl.removeEventListener("pointerout", pointerEnd);
      trackingEl.removeEventListener("pointercancel", pointerEnd);
      trackingEl.removeEventListener("pointerleave", pointerEnd);
      trackingPointerEvents = false;
    }
  }

  function pointerdownHandler(e) {
    eventCache.push(e);

    if (eventCache.length == 1) {
      startPos = eventPos(eventCache[0]);
    } else if (eventCache.length == 2) {
      const pinch = pinchData(eventCache[0], eventCache[1]);
      startPos = pinch.target;
    }

    if (!trackingPointerEvents) {
      trackingEl.addEventListener("pointermove", pointermoveHandler);

      // add pointer end events
      trackingEl.addEventListener("pointerup", pointerEnd);
      trackingEl.addEventListener("pointerout", pointerEnd);
      trackingEl.addEventListener("pointercancel", pointerEnd);
      trackingEl.addEventListener("pointerleave", pointerEnd);
      trackingPointerEvents = true;
    }
  }

  function pointermoveHandler(ev) {
    const index = eventCache.findIndex(
      (cachedEv) => cachedEv.pointerId === ev.pointerId
    );
    eventCache[index] = ev;

    if (eventCache.length === 1) {
    }
    if (eventCache.length === 2) {
      handlePinch();
    }
  }

  function handlePinch() {
    // runs when a pointer moves and exactly two pointers are down
    const pinch = pinchData(eventCache[0], eventCache[1]);

    let multiplier = prevDist > 0 ? pinch.dist / prevDist : 1;

    if (callbacks.zoom) {
      callbacks.zoom(pinch.target, multiplier);
    }

    if (callbacks.pan && startPos.x > 0 && startPos.y > 0) {
      let onPan = callbacks.pan(startPos);
      onPan(pinch.target);
    }

    // Cache the distance for the next move event
    prevDist = pinch.dist;
    startPos = pinch.target;
  }

  function wheelHandler(e) {
    if (callbacks.zoom) {
      let multiplier = Math.pow(1.2, e.deltaY * -0.01);
      callbacks.zoom(eventPos(e), multiplier);
    }
  }
}
