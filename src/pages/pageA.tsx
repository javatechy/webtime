import * as React from "react";
import { Link } from "react-router-dom";
import DwellTime from "../DwellTime";
import { number } from "prop-types";

const dwellTime = new DwellTime({
  timeIntervalEllapsedCallbacks: [],
  absoluteTimeEllapsedCallbacks: [],
  browserTabInactiveCallbacks: [],
  browserTabActiveCallbacks: [],
  idleTimeoutMs: 5000,
  checkCallbacksIntervalMs: 250
});

export class PageA extends React.Component {
  public componentDidMount() {
    dwellTime.startTimer();
  }

  public render(): React.ReactElement<{}> {
    var timeSpentOnPage = 0;
    const cb = {
      multiplier: time => time * 1,
      timeInMilliseconds: 10,
      callback: () => {
        console.log("callback : " + dwellTime.getTimeInMilliseconds() / 1000);
        document.getElementById("timeInSeconds").textContent =
          "" + (dwellTime.getTimeInMilliseconds() / 1000).toFixed(2);
        document.getElementById(
          "logEvents"
        ).textContent = JSON.stringify(dwellTime.LogEvents) + "\n\n\n";
        console.log(dwellTime.LogEvents)
        dwellTime.printEvent();
      }
    };
    dwellTime.addTimeIntervalEllapsedCallback(cb);
    // querySelector

    var monitor = setInterval(() => {
      var isTabActive;

      var elem = document.activeElement;
      window.onfocus = function() {
        isTabActive = true;
      };

      window.onblur = function() {
        isTabActive = false;
      };
      if (elem && elem.tagName == "IFRAME") {
        //clearInterval(monitor);
        // Add timer
        if (isTabActive) {
          dwellTime.startTimer();
          console.log("clicked!");
        } else {
          dwellTime.stopTimer();
        }
      }

      var hiddenPropName = "";
      var visibilityChangeEventName = "";
    }, 50);

    return (
      <div>
        <Link to="/pageB">Navigate to Page B</Link>
        <h2>Hello from page A</h2>
        <br />
        <br />
        <div>
          <h2>
            Total Time Spent by the user on the page:{" "}
            <span id="timeInSeconds">0</span> <span>seconds</span> <br /> <br />{" "}
            <br />
          </h2>
          <br />
          <h3>
            Log Events : <span id="logEvents" ></span> <br /> <br /> <br />
          </h3>
          <iframe
            id="dframe"
            width="420"
            height="345"
            src="https://www.youtube.com/embed/tgbNymZ7vqY"
          />
          <div>
            <h2> What is Lorem Ipsum?</h2>
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
            ever since the 1500s, when an unknown printer took a galley of type
            and scrambled it to make a type specimen book. It has survived not
            only five centuries, but also the leap into electronic typesetting,
            remaining essentially unchanged. It was popularised in the 1960s
            with the release of Letraset sheets containing Lorem Ipsum passages,
            and more recently with desktop publishing software like Aldus
            PageMaker including versions of Lorem Ipsum.
            <br />
            <br />
            <br />
            <br />
            <h2>Why do we use it?</h2>
            It is a long established fact that a reader will be distracted by
            the readable content of a page when looking at its layout. The point
            of using Lorem Ipsum is that <br /> <br /> <br /> <br />
            it has a more-or-less normal distribution of letters, as opposed to
            using 'Content here, content here', making it look like readable
            English. Many desktop publishing packages and web page editors now
            use Lorem Ipsum as their default model text, and a search for 'lorem
            ipsum' will uncover many web sites still in their infancy. Various
            versions have evolved over the years, sometimes by accident,
            sometimes on purpose (injected humour and the like).
            <br />
            <br />
            <br />
            <br />
            <h2>Where does it come from?</h2>
            Contrary to popular belief, Lorem Ipsum is not simply random text.
            It has roots in a piece of classical Latin literature from 45 BC,
            making it over 2000 years old. Richard McClintock, a Latin professor
            at Hampden-Sydney Col <br /> <br /> <br /> <br />
            lege in Virginia, looked up one of the more obscure Latin words,
            consectetur, from a Lorem Ipsum passage, and going through the cites
            of the word in classical literature, discovered the undoubtable
            source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de
            Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by
            Cicero, written in 45 BC. This book is a treatise on the theory of
            ethics, very popular during the Renaissance. The first line of Lorem
            Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section
            1.10.32.
            <br />
            <br />
            <br />
            <br />
            <h2>Where does it come from?</h2>
            Contrary to popular belief, Lorem Ipsum is not simply random text.
            It has roots in a piece of classical Latin literature from 45 BC,
            making it over 2000 years old. Richard McClintock, a Latin professor
            at Hampden-Sydney College <br /> <br /> <br /> <br /> in Virginia,
            looked up one of the more obscure Latin words, consectetur, from a
            Lorem Ipsum passage, and going through the cites of the word in
            classical literature, discovered the undoubtable source. Lorem Ipsum
            comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et
            Malorum" (The Extremes of Good and Evil) by Cicero, written in 45
            BC. This book is a treatise on the theory of ethics, very popular
            during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum
            dolor sit amet..", comes from a line in section 1.10.32.
          </div>
          <br /> <br />
          <p>
            TTime Spent on Page : {timeSpentOnPage}
            our <a href="http://forum.kirupa.com">forums</a>.
          </p>
        </div>
        <br />
      </div>
    );
  }

  public componentWillUnmount() {
    alert("Total dwell time : " + dwellTime.getTimeInMilliseconds());
    dwellTime.reset();
  }
}
