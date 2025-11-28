# Task 6.2: Accessibility Audit

## Task Description
Conduct a comprehensive accessibility audit focusing on new UI elements introduced with the project field feature, ensuring WCAG 2.1 AA compliance.

## Context & Background
The project field feature introduces several new UI elements that must be accessible to all users, including those using screen readers, keyboard navigation, and other assistive technologies.

## Accessibility Checks

### 1. Keyboard Navigation in Project Dropdown
**Elements to Test**:
- Project dropdown in TaskModal
- Project dropdown in EditorModal
- Project selection in QuickCreateBar

**Requirements**:
```typescript
// Keyboard navigation checklist
describe('Project Dropdown Keyboard Navigation', () => {
  test('Tab navigation works correctly', () => {
    // Should be able to tab to project dropdown
    // Should be able to tab away from project dropdown
  });

  test('Arrow key navigation works', () => {
    // Up/down arrows should navigate options
    // Enter should select current option
    // Escape should close dropdown
  });

  test('Screen reader announces options', () => {
    // Each option should have proper ARIA labels
    // Selection changes should be announced
    // Dropdown state should be communicated
  });
});
```

### 2. Screen Reader Support for Project Badges
**Elements to Test**:
- Project badges on TaskCard components
- Project information in TaskTree
- Project context in search results

**Implementation Requirements**:
```tsx
// Proper ARIA implementation
<span 
  className="task-card-project"
  role="note"
  aria-label={`Project: ${task.project}`}
>
  {task.project}
</span>
```

### 3. ARIA Labels for TaskTree Hierarchy
**New Hierarchy Structure**: Project → Phase → Stage → Task

**ARIA Implementation**:
```tsx
// Tree structure with proper ARIA
<div role="tree" aria-label="Task hierarchy by project">
  <div role="treeitem" aria-expanded="true" aria-level="1">
    <span>Capacity Forecast</span>
    <div role="group">
      <div role="treeitem" aria-expanded="false" aria-level="2">
        <span>Phase 0 - Foundation</span>
      </div>
    </div>
  </div>
</div>
```

### 4. Focus Management in EditorModal Project Field
**Focus Requirements**:
- Focus should move to project field when tabbing
- Focus should be trapped within modal when open
- Focus should return to triggering element when modal closes
- Focus indicators should be clearly visible

### 5. Color Contrast for Project Badges
**Contrast Requirements** (WCAG 2.1 AA):
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- Interactive elements: 4.5:1 contrast ratio

**Testing Colors**:
```css
/* Test contrast ratios */
.task-card-project {
  background: var(--accent-primary);
  color: var(--text-primary);
}

/* Must meet contrast requirements for both themes */
.dark-glass { /* contrast testing */ }
.low-glow { /* contrast testing */ }
```

## Specific Test Cases

### 1. Project Dropdown Accessibility
```typescript
describe('Project Dropdown Accessibility', () => {
  test('Has proper ARIA attributes', () => {
    expect(dropdown).toHaveAttribute('role', 'combobox');
    expect(dropdown).toHaveAttribute('aria-expanded');
    expect(dropdown).toHaveAttribute('aria-label');
  });

  test('Announces changes to screen readers', () => {
    // Test that selection changes are announced
    // Test that dropdown state changes are announced
  });

  test('Keyboard navigation works correctly', () => {
    // Tab into dropdown
    // Use arrow keys to navigate
    // Use Enter to select
    // Use Escape to close
  });
});
```

### 2. TaskTree Accessibility
```typescript
describe('TaskTree Accessibility', () => {
  test('Proper tree structure with ARIA', () => {
    expect(tree).toHaveAttribute('role', 'tree');
    expect(treeItems).toHaveAttribute('role', 'treeitem');
    expect(treeItems).toHaveAttribute('aria-level');
    expect(treeItems).toHaveAttribute('aria-expanded');
  });

  test('Project grouping is announced', () => {
    // Screen reader should announce project groups
    // Project counts should be announced
    // Hierarchy changes should be communicated
  });

  test('Keyboard navigation in tree', () => {
    // Arrow keys for navigation
    // Enter to select/open
    // Space to toggle expansion
  });
});
```

### 3. Search Accessibility
```typescript
describe('Search Accessibility', () => {
  test('Search field has proper labels', () => {
    expect(searchInput).toHaveAttribute('aria-label');
    expect(searchInput).toHaveAccessibleName();
  });

  test('Search results are announced', () => {
    // Result count should be announced
    // Filter changes should be communicated
  });

  test('Project search is accessible', () => {
    // Users should know they can search by project
    // Search results should indicate project matches
  });
});
```

## Testing Tools

### 1. Automated Testing
```bash
# axe-core for automated accessibility testing
npm install --save-dev axe-core jest-axe

# React Testing Library with accessibility queries
npm install --save-dev @testing-library/jest-dom
```

### 2. Manual Testing Tools
- **Screen Readers**: NVDA (Windows), JAWS (Windows), VoiceOver (macOS)
- **Keyboard Only**: Test entire workflow without mouse
- **Browser DevTools**: Accessibility tree inspection
- **Color Contrast Analyzers**: WebAIM contrast checker

### 3. Browser Extensions
- **axe DevTools**: Automated accessibility scanning
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Accessibility audit in Chrome DevTools

## Success Criteria
- [ ] All new UI elements are keyboard accessible
- [ ] Screen readers announce projects correctly
- [ ] WCAG 2.1 AA compliance maintained
- [ ] Focus management works properly
- [ ] Color contrast meets requirements
- [ ] ARIA labels are descriptive and accurate
- [ ] Tree hierarchy is properly communicated
- [ ] No accessibility regressions introduced

## Accessibility Test Results

### Test Report Template
```markdown
## Accessibility Audit Results

### Test Scope
- Project dropdown components
- Project badges on task cards
- TaskTree with project hierarchy
- Search functionality with project filtering
- Color contrast for new UI elements

### Results Summary
- Keyboard Navigation: Pass/Fail
- Screen Reader Support: Pass/Fail
- Color Contrast: Pass/Fail
- Focus Management: Pass/Fail
- ARIA Implementation: Pass/Fail

### Issues Found
1. [Specific accessibility issue]
2. [Recommended fix]

### Recommendations
1. [Specific accessibility improvement]
2. [Implementation priority]
```

## Remediation Plan

### High Priority Issues
1. **Missing ARIA labels**: Add proper labels to all interactive elements
2. **Keyboard traps**: Ensure focus management works correctly
3. **Color contrast**: Adjust colors to meet WCAG standards

### Medium Priority Issues
1. **Screen reader announcements**: Improve feedback for screen readers
2. **Focus indicators**: Enhance visual focus indicators
3. **Tree navigation**: Optimize keyboard navigation for TaskTree

### Low Priority Issues
1. **Semantic HTML**: Use appropriate HTML elements
2. **Alternative text**: Add descriptions for visual elements
3. **Language attributes**: Specify language for better screen reader support

## Continuous Accessibility
- Include accessibility tests in CI/CD pipeline
- Regular accessibility audits
- User testing with assistive technology users
- Keep up with WCAG updates and best practices