# Task 3.1: Update TaskCard Display

## Task Description
Update TaskCard component to display project badges on task cards with visual distinction from phase badges.

## Context & Background
Users need to see which project a task belongs to directly on the task card. The project badge should be visually distinct from the phase badge to maintain clear hierarchy and readability.

## Changes Required

### Files to Modify
- `src/components/TaskCard.tsx`
- `src/index.css` (for styling)

### Implementation Details

#### 1. Update TaskCard Component
Add project badge display logic:
```tsx
<div className="task-card-meta">
  {task.project && <span className="task-card-project">{task.project}</span>}
  {task.phase && <span className="task-card-phase">{task.phase}</span>}
  {task.tags && task.tags.length > 0 && (
    <div className="task-card-tags">
      {task.tags.map(tag => <span key={tag} className="task-card-tag">{tag}</span>)}
    </div>
  )}
</div>
```

#### 2. Add CSS Styling
Add project badge styles to `src/index.css`:
```css
.task-card-project {
  background: var(--accent-primary);
  color: var(--text-primary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 8px;
}

.task-card-phase {
  /* Existing phase styles, adjust to differentiate from project */
  background: var(--accent-secondary);
  /* ... existing styles ... */
}
```

#### 3. Visual Hierarchy
- Project badge should be more prominent than phase badge
- Use different colors to distinguish project vs phase
- Maintain consistent spacing and alignment
- Ensure readability at small sizes

### Design Considerations
- **Color contrast**: Project badge should stand out but not overpower task title
- **Layout**: Badges should flow naturally and not clutter the card
- **Accessibility**: Colors should have sufficient contrast ratio
- **Responsive**: Badges should work well at different card sizes

### Example Layout
```
[Task Title]
[Project Badge] [Phase Badge]
[Tags...]
[Agent] [Contexts...]
```

## Success Criteria
- [ ] Project badge visible on task cards with project assigned
- [ ] Visual distinction between project and phase badges
- [ ] Layout remains clean and readable
- [ ] Badges don't overlap or cause layout issues
- [ ] Consistent styling across all themes

## Unit Tests
Create tests to verify:
- Project badge renders when task has project
- Project badge is hidden when task has no project
- Visual distinction between project and phase badges
- CSS classes are applied correctly
- Layout doesn't break with long project names

## Dependencies
- Task 2.1 (Task Type Definition) for project field
- Task 2.4 (Extension Message Handlers) for project data
- Theme system for consistent styling

## Accessibility Requirements
- Proper color contrast ratios (WCAG 2.1 AA)
- Screen reader support for badge content
- Keyboard navigation compatibility
- Clear visual indicators for color-blind users

## Performance Considerations
- Minimal impact on card rendering performance
- CSS should be efficient and not cause layout thrashing
- Consider memoization for badge components if needed