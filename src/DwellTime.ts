// import throttle from "lodash/throttle";

interface BaseTimeEllapsedCallbackData {
  callback: (timeInMs: number) => void;
  timeInMilliseconds: number;
}

type BasicCallback = (timeInMs: number) => void;

export interface TimeIntervalEllapsedCallbackData
  extends BaseTimeEllapsedCallbackData {
  multiplier: (time: number) => number;
}

export interface AbsoluteTimeEllapsedCallbackData
  extends BaseTimeEllapsedCallbackData {
  pending: boolean;
}

interface Settings {
  timeIntervalEllapsedCallbacks?: TimeIntervalEllapsedCallbackData[];
  absoluteTimeEllapsedCallbacks?: AbsoluteTimeEllapsedCallbackData[];
  browserTabInactiveCallbacks?: BasicCallback[];
  browserTabActiveCallbacks?: BasicCallback[];
  idleTimeoutMs?: number;
  checkCallbacksIntervalMs?: number;
}
interface Times {
  start: number;
  stop: number | null;
}

// Window/document events
const windowIdleEvents = ["scroll", "resize"];
const documentIdleEvents = [
  "keyup",
  "keydown",
  "touchstart",
  "click",
  "contextmenu"
];

export default class DwellTime {
  private running: boolean;
  private times: Times[];
  private idle: boolean;
  private checkCallbackIntervalId?: number;
  private currentIdleTimeMs: number;

  private idleTimeoutMs: number;
  private checkCallbacksIntervalMs: number;
  private browserTabActiveCallbacks: BasicCallback[]; // when tab is active
  private browserTabInactiveCallbacks: BasicCallback[]; // when tab is inactive
  private timeIntervalEllapsedCallbacks: TimeIntervalEllapsedCallbackData[];
  private absoluteTimeEllapsedCallbacks: AbsoluteTimeEllapsedCallbackData[];

  constructor({
    timeIntervalEllapsedCallbacks,
    absoluteTimeEllapsedCallbacks,
    checkCallbacksIntervalMs,
    browserTabInactiveCallbacks,
    browserTabActiveCallbacks,
    idleTimeoutMs
  }: Settings) {
    this.running = false;
    this.times = [];
    this.idle = false;
    this.currentIdleTimeMs = 0;
    this.idleTimeoutMs = idleTimeoutMs || 3000; // 3s
    this.checkCallbacksIntervalMs = checkCallbacksIntervalMs || 100;
    this.timeIntervalEllapsedCallbacks = timeIntervalEllapsedCallbacks || [];
    this.absoluteTimeEllapsedCallbacks = absoluteTimeEllapsedCallbacks || [];
    this.browserTabActiveCallbacks = browserTabActiveCallbacks || [];
    this.browserTabInactiveCallbacks = browserTabInactiveCallbacks || [];
    this.registerEventListeners();
  }

  private onBrowserTabInactive = (event: Event) => {
    // if running pause timer
    if (this.isRunning()) {
      this.stopTimer();
    }

    this.browserTabInactiveCallbacks.forEach(fn =>
      fn(this.getTimeInMilliseconds())
    );
  };

  private onBrowserTabActive = (event: Event) => {
    // if not running start timer
    if (!this.isRunning()) {
      this.startTimer();
    }

    this.browserTabActiveCallbacks.forEach(fn =>
      fn(this.getTimeInMilliseconds())
    );
  };

  public resetIdleTime = () => {
    if (this.idle) {
      this.startTimer();
    }
    this.idle = false;
    this.currentIdleTimeMs = 0;
  };

  public resetIdleTimeWithStartTimer = () => {
    this.resetIdleTime();
    this.startTimer();
  };

  public getTimes = (): Times[] => {
    return this.times;
  };

  private registerEventListeners = () => {
    const eventListenerOptions = { passive: true };

    window.addEventListener(
      "blur",
      this.onBrowserTabInactive,
      eventListenerOptions
    );
    
    window.addEventListener(
      "focus",
      this.onBrowserTabActive,
      eventListenerOptions
    );
    // restrict this method to be called only 2000 times
    /** const throttleResetIdleTime = throttle(this.resetIdleTime, 2000, {
      leading: true,
      trailing: false
    });
*/
    windowIdleEvents.forEach(event => {
      window.addEventListener(
        event,
        this.resetIdleTime, //throttleResetIdleTime
        eventListenerOptions
      );
    });

    document.addEventListener(
      "mousemove",
      this.resetIdleTimeWithStartTimer,
      eventListenerOptions
    );

    document.addEventListener(
      "mouseleave",
      this.onBrowserTabInactive,
      eventListenerOptions
    );

    documentIdleEvents.forEach(event =>
      document.addEventListener(
        event,
        this.resetIdleTime, // throttleResetIdleTime,
        eventListenerOptions
      )
    );
  };

  public startTimer = () => {
    if (!this.checkCallbackIntervalId) {
      this.checkCallbacksOnInterval();
    }
    const last = this.times[this.times.length - 1];
    if (last && last.stop === null) {
      return;
    }
    this.times.push({
      start: performance.now(), // finds the current time
      stop: null
    });
    this.running = true;
  };

  public stopTimer() {
    if (!this.times.length) {
      return;
    }
    this.times[this.times.length - 1].stop = performance.now();
    this.running = false;
  }

  public resumeTimer() {
    this.running = true;
  }

  //Get Time in Milliseconds
  public getTimeInMilliseconds(): number {
    return this.times.reduce((acc, current) => {
      if (current.stop) {
        acc = acc + (current.stop - current.start);
      } else {
        acc = acc + (performance.now() - current.start);
      }
      return acc;
    }, 0);
  }

  // --- --- --- --- --- --- --- ---- Check inteval for callbacks-------------

  private checkCallbacksOnInterval = () => {
    this.checkCallbackIntervalId = window.setInterval(() => {
      this.onTimePassed();
    }, this.checkCallbacksIntervalMs);
  };

  private onTimePassed = () => {
    // check all callbacks time and if passed execute callback
    this.absoluteTimeEllapsedCallbacks.forEach(
      ({ callback, pending, timeInMilliseconds }, index) => {
        if (pending && timeInMilliseconds <= this.getTimeInMilliseconds()) {
          callback(this.getTimeInMilliseconds());
          this.absoluteTimeEllapsedCallbacks[index].pending = false;
        }
      }
    );

    this.timeIntervalEllapsedCallbacks.forEach(
      ({ callback, timeInMilliseconds, multiplier }, index) => {
        if (timeInMilliseconds <= this.getTimeInMilliseconds()) {
          callback(this.getTimeInMilliseconds());
          this.timeIntervalEllapsedCallbacks[
            index
          ].timeInMilliseconds = multiplier(timeInMilliseconds);
        }
      }
    );

    if (this.currentIdleTimeMs >= this.idleTimeoutMs && this.isRunning()) {
      this.idle = true;
      this.stopTimer();
    } else {
      this.currentIdleTimeMs += this.checkCallbacksIntervalMs;
    }
  };

  // ------------------------------------------------------------------------- Reset methods -----------------------------------------------------
  // Check if timer is running
  public isRunning = () => {
    return this.running;
  };

  //  Reset all times
  public reset = () => {
    this.times = [];
    //this.destroy();
  };

  // Cleanup event listeners and timers
  public destroy = () => {
    this.unregisterEventListeners();
    if (this.checkCallbackIntervalId) {
      window.clearInterval(this.checkCallbackIntervalId);
    }
  };

  // unregister events
  private unregisterEventListeners = () => {
    window.removeEventListener("blur", this.onBrowserTabInactive);
    window.removeEventListener("focus", this.onBrowserTabActive);
    windowIdleEvents.forEach(event =>
      window.removeEventListener(event, this.resetIdleTime)
    );

    documentIdleEvents.forEach(event =>
      document.removeEventListener(event, this.resetIdleTime)
    );
  };

  // ------------------------------------------------------------------------- Send events callback methods -----------------------------------------------------
  //callback that is executed on interval
  public addTimeIntervalEllapsedCallback = (
    timeIntervalEllapsedCallback: TimeIntervalEllapsedCallbackData
  ) => {
    this.timeIntervalEllapsedCallbacks.push(timeIntervalEllapsedCallback);
  };

  //callback that is executed on absolute time
  public addAbsoluteTimeEllapsedCallback = (
    absoluteTimeEllapsedCallback: AbsoluteTimeEllapsedCallbackData
  ) => {
    this.absoluteTimeEllapsedCallbacks.push(absoluteTimeEllapsedCallback);
  };

  //callback executed when browser tab becomes inactive
  public addBrowserTabInactiveCallback = (
    browserTabInactiveCallback: BasicCallback
  ) => {
    this.browserTabInactiveCallbacks.push(browserTabInactiveCallback);
  };

  // callback executed when browser tab becomes active
  public addBrowserTabActiveCallback = (
    browserTabActiveCallback: BasicCallback
  ) => {
    this.browserTabActiveCallbacks.push(browserTabActiveCallback);
  };
}
