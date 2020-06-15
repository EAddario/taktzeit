import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders home link', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/Home/i);
  expect(linkElement).toBeInTheDocument();
});

test('renders other page link', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/Other Page/i);
  expect(linkElement).toBeInTheDocument();
});