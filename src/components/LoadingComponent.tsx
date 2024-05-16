import React, { FC, useEffect, useRef, useState, ReactNode } from 'react';
export const LoadingComponent: FC = () => {
  return <>
    <div className="skeleton-lines mt-3 mb-3">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
    <progress className="progress is-large is-primary" max="100">15%</progress>
    <div className="skeleton-lines mb-3">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <span className="icon has-text-dark is-large is-align-self-flex-end mr-3">
        <i className="fas fa-coffee fa-3x"></i>
      </span>
    </div>
  </>;
}

