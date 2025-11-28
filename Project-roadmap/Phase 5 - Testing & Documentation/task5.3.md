# Task 5.3: Create Example Project Structure

## Task Description
Create example project context files that demonstrate best practices and provide users with a useful reference for creating their own project contexts.

## Context & Background
Users benefit from seeing well-structured examples of project context files. These examples should demonstrate different types of projects, various content structures, and best practices for organizing project information for AI agents.

## Changes Required

### Files to Create
Create example project files in a template location (not in the main `.vibekan` folder):
- `examples/projects/capacity-forecast.md`
- `examples/projects/daily-reports.md`
- `examples/projects/weekly-reports.md`
- `examples/projects/api-development.md`

### Example Project Files

#### 1. Capacity Forecast Project (`examples/projects/capacity-forecast.md`)
```markdown
# Capacity Forecast

## Project Overview
Staffing optimization system using hourly simulation engine to forecast capacity needs and provide visual staffing recommendations.

## Goals
- Build hourly simulation engine for capacity forecasting
- Integrate with existing email dashboard infrastructure
- Automate daily forecast generation and delivery
- Provide visual staffing recommendations with confidence intervals
- Reduce over/under staffing situations by 25%

## Key Components
- **Configuration System** (Phase 1): Manage simulation parameters, business rules, and thresholds
- **Simulation Algorithm** (Phase 2): Core forecasting engine with Monte Carlo methods
- **Database Persistence** (Phase 3): Store historical data, forecasts, and validation results
- **Dashboard Integration** (Phase 4): Embed forecasts in existing email dashboard
- **Validation & Backtesting** (Phase 5): Validate accuracy against historical data
- **Automation** (Phase 6): Schedule daily runs and alert generation
- **Monitoring** (Phase 7): Track system health and forecast accuracy

## Technical Architecture
- **Backend**: Python with pandas, numpy for simulations
- **Database**: PostgreSQL for historical data storage
- **Integration**: REST APIs for dashboard connectivity
- **Scheduling**: Cron jobs for automated execution
- **Monitoring**: Grafana dashboards for system metrics

## Key Links
- [Main Roadmap](../../roadmap.md)
- [Architecture](../architecture.md)
- [Email Dashboard Docs](../../apps/email_dashboard/documentation/)
- [Database Schema](./database/schema.sql)

## Dependencies
- Existing email dashboard infrastructure
- Agent availability data from workforce management system
- Historical forecasting data (2+ years)
- Real-time ticket volume data
- Business calendar and event data

## Business Context
- **Stakeholders**: Operations team, Workforce management, IT leadership
- **Success Metrics**: Forecast accuracy >85%, Staffing efficiency improvement, Cost reduction
- **Constraints**: Must integrate with existing systems, 3-month delivery timeline
- **Compliance**: Data privacy regulations for employee information

## AI Agent Notes
When working on this project:
- Always consider the simulation engine's performance requirements
- Maintain backward compatibility with existing dashboard APIs
- Use established patterns for database operations
- Follow the phased delivery approach - don't skip validation phases
- Consider peak/off-peak variations in all calculations
- Document any new business rules or thresholds added
```

#### 2. Daily Reports Project (`examples/projects/daily-reports.md`)
```markdown
# Daily Reports

## Project Overview
Automated generation and distribution of operational daily reports for multiple stakeholder groups.

## Goals
- Automate daily report generation for operations team
- Reduce manual report creation time by 90%
- Provide consistent, error-free daily summaries
- Enable self-service report customization
- Improve data accuracy and timeliness

## Report Types
- **Operations Summary**: High-level metrics and KPIs
- **Team Performance**: Individual and team productivity metrics
- **System Health**: Infrastructure and application status
- **Customer Metrics**: Satisfaction scores and feedback summary
- **Financial Summary**: Revenue and cost metrics

## Technical Requirements
- **Data Sources**: Multiple databases, APIs, and log files
- **Processing**: ETL pipeline with data validation and cleansing
- **Output Formats**: PDF, Excel, HTML email, dashboard widgets
- **Distribution**: Email, Slack, internal portals
- **Scheduling**: Configurable delivery times and frequencies

## Implementation Approach
1. **Data Integration**: Connect to all required data sources
2. **Template System**: Create flexible report templates
3. **Processing Engine**: Build reliable data processing pipeline
4. **Distribution System**: Implement multi-channel delivery
5. **Self-Service Portal**: Allow user customization
6. **Monitoring**: Track report generation and delivery success

## Success Criteria
- 99.5% report generation success rate
- <5 minute report generation time
- Zero manual intervention required
- Positive user satisfaction scores
- Measurable time savings for operations team

## Known Challenges
- Data source availability and reliability
- Report format standardization across teams
- Performance optimization for large datasets
- Error handling and recovery procedures
```

#### 3. API Development Project (`examples/projects/api-development.md`)
```markdown
# API Development

## Project Overview
Development of RESTful APIs to support internal applications and third-party integrations.

## API Standards
- **RESTful Design**: Follow REST principles and best practices
- **OpenAPI Specification**: Use OpenAPI 3.0 for documentation
- **Authentication**: JWT tokens with refresh mechanism
- **Rate Limiting**: Implement fair usage policies
- **Versioning**: URL versioning (/v1/, /v2/)
- **Error Handling**: Consistent error response format

## Development Guidelines
- **Code Quality**: Maintain >80% test coverage
- **Documentation**: Auto-generated API docs with examples
- **Security**: Input validation, SQL injection prevention, XSS protection
- **Performance**: Response time <200ms for standard requests
- **Monitoring**: Comprehensive logging and metrics
- **Deployment**: CI/CD pipeline with automated testing

## Common Patterns
### Authentication
```javascript
// JWT token validation
const validateToken = (token) => {
  // Implementation details
};
```

### Error Responses
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Pagination
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Testing Strategy
- **Unit Tests**: Individual endpoint logic
- **Integration Tests**: End-to-end API workflows
- **Load Tests**: Performance under expected load
- **Security Tests**: Vulnerability assessments
- **Contract Tests**: API contract validation

## Deployment Checklist
- [ ] All tests passing
- [ ] API documentation updated
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Monitoring configured
- [ ] Rollback plan prepared
```

## Success Criteria
- [ ] Example project demonstrates best practices
- [ ] Multiple project types are covered
- [ ] Markdown rendering looks good
- [ ] Useful reference for users creating their own projects
- [ ] Examples are realistic and comprehensive
- [ ] Documentation explains how to use examples

## Documentation
Create a README in the examples folder:
```markdown
# Project Examples

These example project files demonstrate best practices for creating project context files in Vibekan.

## How to Use These Examples

1. **Copy and Customize**: Copy an example file to your `.vibekan/_context/projects/` folder and customize it for your project
2. **Learn Patterns**: Study the structure and content organization to understand what makes a good project context file
3. **Adapt to Your Needs**: Use these as starting points, but adapt the structure and content to match your specific requirements

## Example Files

- **capacity-forecast.md**: Complex multi-phase project with technical details
- **daily-reports.md**: Operational project with clear deliverables
- **weekly-reports.md**: Similar to daily reports but with different scope
- **api-development.md**: Technical project with standards and guidelines

## Best Practices Demonstrated

### Content Organization
- Clear project overview and goals
- Technical requirements and architecture
- Success criteria and metrics
- Dependencies and constraints
- Links to related documentation

### For AI Agents
- Context about project scope and objectives
- Technical constraints and requirements
- Links to relevant documentation
- Known challenges and considerations
- Success criteria and quality standards

### Maintenance
- Keep project context files up to date
- Update goals and requirements as they change
- Add new learnings and constraints
- Link to relevant architecture decisions
```

## Usage Instructions
Add to main README:
```markdown
## Project Examples
See the `examples/projects/` folder for sample project context files that demonstrate best practices for organizing multi-project workflows.
```

## Dependencies
- None - these are standalone example files
- Should be created after project field functionality is complete
- Can be used as reference for testing

## Future Maintenance
- Keep examples up to date with best practices
- Add new examples as patterns emerge
- Update examples based on user feedback
- Consider community-contributed examples