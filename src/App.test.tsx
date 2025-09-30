import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import App from './App';

// Mock the persistor to avoid issues in tests
const MockPersistGate = ({ children }: { children: React.ReactNode }) => <>{children}</>;

test('renders AI Interview Assistant', () => {
  render(
    <Provider store={store}>
      <MockPersistGate>
        <App />
      </MockPersistGate>
    </Provider>
  );
  
  const titleElement = screen.getByText(/AI-Powered Interview Assistant/i);
  expect(titleElement).toBeTruthy();
});

test('renders both tabs', () => {
  render(
    <Provider store={store}>
      <MockPersistGate>
        <App />
      </MockPersistGate>
    </Provider>
  );
  
  const intervieweeTab = screen.getByText(/Interviewee/i);
  const interviewerTab = screen.getByText(/Interviewer Dashboard/i);
  
  expect(intervieweeTab).toBeTruthy();
  expect(interviewerTab).toBeTruthy();
});