import { FC, useRef, useEffect } from 'react';
import { getHMSFromSeconds, getHMSToSeconds } from './../lib/Utils';

interface BaseLayoutProps {
  task: DBTask | ActiveTask;
}

export const TimeInputComponent: FC<BaseLayoutProps> = ({ task }) => {
  const hms = getHMSFromSeconds(task.seconds);

  const secondsInput = useRef<HTMLInputElement>(null);
  const hInput = useRef<HTMLInputElement>(null);
  const mInput = useRef<HTMLInputElement>(null);
  const sInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (secondsInput.current && hInput.current && mInput.current && sInput.current) {
      secondsInput.current.value = String(task.seconds);
      hInput.current.value = String(hms.hours);
      mInput.current.value = String(hms.minutes);
      sInput.current.value = String(hms.seconds);
    }
  }, [task.seconds, hInput, mInput, sInput]);

  const onChange = () => {
    if (secondsInput.current && hInput.current && mInput.current && sInput.current) {
      const secondsValue = getHMSToSeconds(Number(hInput.current.value), Number(mInput.current.value), Number(sInput.current.value));
      secondsInput.current.value = String(secondsValue);
    }
  }

  return <>
    <input ref={secondsInput} required name="seconds" type="hidden" defaultValue={ task.seconds } />

    <div className="grid has-3-cols">
      <div className="cell">
        <label className="label">Hours</label>
      </div>
      <div className="cell">
        <label className="label">Minutes</label>
      </div>
      <div className="cell">
        <label className="label">Seconds</label>
      </div>
    </div>
    <div className="grid has-3-cols">
      <div className="cell">
        <input ref={hInput} required className="input timeinput" min="0" type="number" defaultValue={ hms.hours } placeholder="Hours" onChange={onChange} />
      </div>
      <div className="cell">
        <input ref={mInput} required className="input timeinput" min="0" type="number" defaultValue={ hms.minutes } placeholder="Hours" onChange={onChange} />
      </div>
      <div className="cell">
        <input ref={sInput} required className="input timeinput" min="0" type="number" defaultValue={ hms.seconds } placeholder="Hours" onChange={onChange} />
      </div>
    </div>
  </>
}
