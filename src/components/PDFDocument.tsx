import React, { FC } from 'react';
import { connect } from 'react-redux';
import type { RootState } from './Store'
import { getHMSStringFromSeconds } from './../lib/Utils';

type TotalViewProps = {
  pdfDocument: PDFQueryResult[],
}

const TotalView: FC<TotalViewProps> = ({ pdfDocument }) => {
  const total: PDFTotalObject = {}
  pdfDocument.forEach((item: PDFQueryResult) => {
    if (!total[item.project_name]) {
      total[item.project_name] = {}
    }
    if (!total[item.project_name][item.name]) {
      total[item.project_name][item.name] = 0
    }
    total[item.project_name][item.name] += item.seconds
  })
  return <>
    <section className="hero">
      <div className="hero-body">
        <p className="title">Total Time</p>
        <p className="subtitle">Total time spent on projects and tasks combined.</p>
      </div>
    </section>
    {Object.keys(total).map((projectName: string, idx: number) => (
      <div key={idx} className="card">
        <header className="card-header">
          <p className="card-header-title">{projectName}</p>
        </header>
        <div className="card-content">
          <div className="content">
            {Object.keys(total[projectName]).map((taskName: string, idx: number) => (
              <div key={idx}>
                <p>{taskName} {getHMSStringFromSeconds(total[projectName][taskName])}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </>
}

const BasicView: FC = (pdfDocument: PDFQueryResult[]) => {
  return <>
    <section className="hero">
      <div className="hero-body">
        <p className="title">timetrack.desktop</p>
        <p className="subtitle"></p>Simple desktop 🖥️ application to track your time ⏰ spent on different projects 🎉.</div>
    </section>
    { pdfDocument.map((item: PDFQueryResult, idx: number) => (
      <div key={idx} className="card">
        <header className="card-header">
          <p className="card-header-title">{item.project_name}</p>
        </header>
        <div className="card-content">
          <div className="content">
            <h1>{item.name}</h1>
            <p>{item.description}</p>
            <br />
            <time dateTime={item.date}>{item.date}</time>
          </div>
        </div>
        <footer className="card-footer">
          <p className="card-footer-item">Time spent: {getHMSStringFromSeconds(item.seconds)}</p>
        </footer>
      </div>
    ))}
    <TotalView pdfDocument={pdfDocument} />
  </>;
}

type Props = {
  pdfDocument: PDFQueryResult[],
}

const Component: FC<Props> = ({ pdfDocument }) => {
  if (!pdfDocument.length) {
    return null;
  }
  return (
    <div>
      {BasicView(pdfDocument)}
    </div>
  )
}

const mapStateToProps = (state: RootState) => {
  return {
    pdfDocument: state.pdfDocument.value.name,
  }
}
const connected = connect(mapStateToProps)(Component);

export const PDFDocument = connected;
