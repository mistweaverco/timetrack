import { FC, useRef, useEffect } from 'react';
import { getHMSStringFromSeconds } from './../lib/Utils';

interface BaseLayoutProps {
  task: DBTask | ActiveTask;
}

export const TimerComponent: FC<BaseLayoutProps> = ({ task }) => {
  const ref = useRef<HTMLDivElement>(null);
  let tick: NodeJS.Timeout | null = null;
  let s = task.seconds;

  useEffect(() => {
    if ('isActive' in task && task.isActive) {
      if (ref.current) {
        tick = setInterval(() => {
          s++;
          ref.current.innerHTML = getHMSStringFromSeconds(s);
        }, 1000);
      }
    }
    return () => {
      if (tick) clearInterval(tick);
    }
  }, [task])
  return (
    <div ref={ref}>{getHMSStringFromSeconds(task.seconds)}</div>
  )
}
