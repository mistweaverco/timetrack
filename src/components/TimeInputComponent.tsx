import { FC, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { getHMSFromSeconds, getHMSToSeconds } from './../lib/Utils';

interface BaseLayoutProps {
  task: DBTask | ActiveTask;
  addUpHours?: boolean;
}

export const TimeInputComponent: FC<BaseLayoutProps> = ({ task, addUpHours }) => {
  const hms = getHMSFromSeconds(task.seconds);
  const isActive = 'isActive' in task;
  const isActiveAndCounting = 'isActive' in task && task.isActive;

  const addupDropdownRef = useRef<HTMLDivElement>(null);
  const secondsInput = useRef<HTMLInputElement>(null);
  const hInput = useRef<HTMLInputElement>(null);
  const mInput = useRef<HTMLInputElement>(null);
  const sInput = useRef<HTMLInputElement>(null);
  const haInput = useRef<HTMLInputElement>(null);
  const maInput = useRef<HTMLInputElement>(null);
  const saInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (secondsInput.current && hInput.current && mInput.current && sInput.current) {
      secondsInput.current.value = String(task.seconds);
      hInput.current.value = String(hms.hours);
      mInput.current.value = String(hms.minutes);
      sInput.current.value = String(hms.seconds);
    }
  }, [task.seconds, hInput, mInput, sInput]);

  const onAddupDropdownButtonClick = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    evt.currentTarget.closest('button')?.classList.toggle('is-hidden');
    addupDropdownRef.current?.classList.toggle('is-hidden');
  }

  const onChange = () => {
    if (secondsInput.current && hInput.current && mInput.current && sInput.current) {
      const secondsValue = getHMSToSeconds(Number(hInput.current.value), Number(mInput.current.value), Number(sInput.current.value));
      secondsInput.current.value = String(secondsValue);
    }
  }

  const onAddupButtonClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (secondsInput.current && hInput.current && mInput.current && sInput.current) {
      const secondsValue = getHMSToSeconds(Number(hInput.current.value) + Number(haInput.current.value), Number(mInput.current.value) + Number(maInput.current.value), Number(sInput.current.value) + Number(saInput.current.value));
      const hms = getHMSFromSeconds(secondsValue);
      hInput.current.value = String(hms.hours);
      mInput.current.value = String(hms.minutes);
      sInput.current.value = String(hms.seconds);
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
        <div className={clsx('control', isActiveAndCounting ? 'is-loading': null)}>
          <input ref={hInput} required disabled={isActive} className="input" min="0" type="number" defaultValue={ hms.hours } placeholder="Hours" onChange={onChange} />
        </div>
      </div>
      <div className="cell">
        <div className={clsx('control', isActiveAndCounting ? 'is-loading': null)}>
          <input ref={mInput} required disabled={isActive} className="input" min="0" max="59" type="number" defaultValue={ hms.minutes } placeholder="Hours" onChange={onChange} />
        </div>
      </div>
      <div className="cell">
        <div className={clsx('control', isActiveAndCounting ? 'is-loading': null)}>
          <input ref={sInput} required disabled={isActive} className="input" min="0" max="59" type="number" defaultValue={ hms.seconds } placeholder="Hours" onChange={onChange} />
        </div>
      </div>
    </div>
    { addUpHours && <>
      <button  onClick={onAddupDropdownButtonClick} className="button">
        <span>Add up time to the current task..</span>
        <span className="icon is-small">
          <i className="fas fa-angle-down" aria-hidden="true"></i>
        </span>
      </button>
      <div className="is-hidden" ref={addupDropdownRef}>
        <div className="notification is-secondary">
          <span className="icon is-large">
            <i className="fas fa-info-circle"></i>
          </span>
          <span><strong>Addup Time</strong></span>
          <p>Use this to add time to the current task.</p>
        </div>
        <div className="grid has-3-cols">
          <div className="cell">
            <div className="field">
              <label className="label">Addup Hours</label>
              <div className="control">
                <input ref={haInput} required className="input" min="0" type="number" defaultValue="0" placeholder="Hours" />
              </div>
            </div>
          </div>
          <div className="cell">
            <div className="field">
              <label className="label">Addup Minutes</label>
              <div className="control">
                <input ref={maInput} required className="input" min="0" max="59" type="number" defaultValue="0" placeholder="Hours" />
              </div>
            </div>
          </div>
          <div className="cell">
            <div className="field">
              <label className="label">Addup Seconds</label>
              <div className="control">
                <input ref={saInput} required className="input" min="0" max="59" type="number" defaultValue="0" placeholder="Hours" />
              </div>
            </div>
          </div>
        </div>
        <div className="field">
          <div className="control">
            <button className="button is-secondary" onClick={onAddupButtonClick}>Addup</button>
          </div>
        </div>
      </div>
    </> }
  </>
}
