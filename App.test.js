// Import testing utilities from React Testing Library and the App component
import { render, screen } from '@testing-library/react';
import App from './App';

// Test case to check if the collaborative editor heading renders correctly
test('renders the collaborative editor heading', () => {
  // Render the App component in a virtual DOM
  render(<App />);
  // Find the heading element with text matching "My Collaborative Editor" (case-insensitive)
  const headingElement = screen.getByText(/My Collaborative Editor/i);
  // Assert that the heading element is present in the document
  expect(headingElement).toBeInTheDocument();
});
