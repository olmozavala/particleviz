import React from 'react';
import ReactDOM from 'react-dom';
import ParticleVizManager from './ParticleVizManager';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<ParticleVizManager />, div);
  ReactDOM.unmountComponentAtNode(div);
});
