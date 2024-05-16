import { useAppDispatch } from './Store/hooks'
import { updateActiveTaskSeconds } from './Store/slices/activeTasks'
import { FC, useRef, useEffect } from 'react';
import { getHMSStringFromSeconds } from './../lib/Utils';

interface BaseLayoutProps {
  task: DBTask | ActiveTask;
}

export const TimerComponent: FC<BaseLayoutProps> = ({ task }) => {
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);
  let tick: NodeJS.Timeout | null = null;
  let s = task.seconds;

  useEffect(() => {
    if ('isActive' in task && task.isActive) {
      if (ref.current) {
        tick = setInterval(() => {
          s++;
          dispatch(
            updateActiveTaskSeconds({
              name: task.name,
              project_name: task.project_name,
              date: task.date,
              seconds: s,
            })
          );
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
