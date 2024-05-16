import { FC } from 'react';
import { connect } from 'react-redux';
import type { RootState } from './Store'
import { ActiveTasks } from './ActiveTasks';
import { Projects } from './Projects';
import { Tasks } from './Tasks';
import { TaskDefinitions } from './TaskDefinitions';
import { Search } from './Search';
import { PDFExport } from './PDFExport';
import { PDFDocument } from './PDFDocument';
import { useAppDispatch } from './Store/hooks'
import { setSelectedPanel } from './Store/slices/selectedPanel'

type Props = {
  selectedPanel: string,
}

const Component: FC<Props> = ({ selectedPanel }) => {
  const dispatch = useAppDispatch();

  const handleTopButtonsClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    const target = evt.target as HTMLButtonElement;
    const root = target.closest('button');
    switch (root.dataset.action) {
      case 'reportABug':
        root.classList.add('is-loading');
        setTimeout(() => {
          root.classList.remove('is-loading');
        }, 3000);
        window.open('https://github.com/mistweaverco/timetrack.desktop/issues/new');
        break;
      case 'seeTheCode':
        root.classList.add('is-loading');
        setTimeout(() => {
          root.classList.remove('is-loading');
        }, 3000);
        window.open('https://github.com/mistweaverco/timetrack.desktop');
        break;
      default:
        break;
    }
  }

  const handlePanelClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    const target = evt.target as HTMLButtonElement;
    const root = target.closest('a') as HTMLAnchorElement;
    const nav = root.closest('nav');
    const heading = nav.querySelector('.panel-heading');
    const items = nav.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    items.forEach((item) => {
      item.classList.remove('is-active');
    });
    root.classList.add('is-active');
    switch (root.dataset.action) {
      case 'Overview':
        heading.textContent = 'Overview';
        dispatch(setSelectedPanel({ name: 'Overview' }));
        break;
      case 'Search':
        heading.textContent = 'Search';
        dispatch(setSelectedPanel({ name: 'Search' }));
        break;
      case 'PDFExport':
        heading.textContent = 'PDF Export';
        dispatch(setSelectedPanel({ name: 'PDFExport' }));
        break;
      default:
        break;
    }
  }

  const OverviewComponent: FC = () => {
    return <>
      <ActiveTasks />
      <Projects />
      <Tasks />
      <TaskDefinitions />
    </>;
  }

  const ActiveComponent: FC = () => {
    return <>
      { selectedPanel === 'Search' && <Search /> }
      { selectedPanel === 'PDFExport' && <PDFExport /> }
      { selectedPanel === 'PDFDocument' && <PDFDocument /> }
      { selectedPanel === 'Overview' && <OverviewComponent /> }
    </>;
  }

  return <>
    { selectedPanel !== "PDFDocument" ?
      <>
        <nav className="navbar" role="navigation" aria-label="main navigation">
          <div className="navbar-menu p-2">
            <div className="navbar-start">
              <div className="navbar-item">
                <div className="buttons">
                </div>
              </div>
            </div>

            <div className="navbar-end">
              <div className="navbar-item">
                <div className="buttons">
                  <button className="button is-secondary" data-action="reportABug" onClick={handleTopButtonsClick}>
                    <span className="icon">
                      <i className="fa-solid fa-bug"></i>
                    </span>
                    <strong>Report a bug</strong>
                  </button>
                  <button className="button is-primary" data-action="seeTheCode" onClick={handleTopButtonsClick}>
                    <span className="icon">
                      <i className="fa-solid fa-code"></i>
                    </span>
                    <strong>See the code</strong>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <nav className="panel">
          <p className="panel-heading">Overview</p>
          <p className="panel-tabs">
            <a className={selectedPanel === "Overview" ? "is-active" : null} data-action="Overview" onClick={handlePanelClick}>
              <span className="icon">
                <i className="fa-solid fa-chart-bar"></i>
              </span>
              Overview
            </a>
            <a className={selectedPanel === "Search" ? "is-active" : null} data-action="Search" onClick={handlePanelClick}>
              <span className="icon">
                <i className="fa-solid fa-magnifying-glass"></i>
              </span>
              Search
            </a>
            <a className={selectedPanel === "PDFExport" ? "is-active" : null} data-action="PDFExport" onClick={handlePanelClick}>
              <span className="icon">
                <i className="fa-regular fa-file-pdf"></i>
              </span>
              PDF Export
            </a>
          </p>
        </nav>
      </>
    : null }
      <ActiveComponent />
  </>;
}


const mapStateToProps = (state: RootState) => {
  return {
    selectedPanel: state.selectedPanel.value.name,
  }
}
const connected = connect(mapStateToProps)(Component);

export const Navigation = connected;
