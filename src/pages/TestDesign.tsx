import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Upload as UploadIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import CodeIcon from '@mui/icons-material/Code';
import { saveFiles } from '../utils/fileUtils';

interface TestCase {
  id: string;
  title: string;
  description: string;
  type: 'Functional' | 'Integration' | 'Performance' | 'Security';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Draft' | 'Review' | 'Approved';
  steps: TestStep[];
  expectedResults: string;
  prerequisites: string;
  requirementId?: string;
}

interface TestStep {
  number: number;
  description: string;
  expectedResult: string;
}

interface UploadedRequirement {
  id: string;
  title: string;
  description: string;
  fileName: string;
  scenarios?: string[]; // Added for scenarios
}

interface RequirementAnalysis {
  actions: string[];
  conditions: string[];
  validations: string[];
  systemComponents: string[];
  dataElements: string[];
}

interface RequirementStep {
  action: string;
  condition?: string;
  validation?: string;
  expected?: string;
}

const analyzeRequirement = (title: string, description: string): RequirementAnalysis => {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  // Extract key components from requirement
  const analysis: RequirementAnalysis = {
    actions: [],
    conditions: [],
    validations: [],
    systemComponents: [],
    dataElements: []
  };

  // Action words that indicate functionality
  const actionPatterns = [
    /\b(create|add|generate|upload|save|store|insert)\b/g,
    /\b(update|modify|change|edit|revise)\b/g,
    /\b(delete|remove|archive)\b/g,
    /\b(view|display|show|list|present)\b/g,
    /\b(search|find|filter|query)\b/g,
    /\b(validate|verify|check|confirm)\b/g,
    /\b(process|calculate|compute)\b/g,
    /\b(send|transmit|submit)\b/g
  ];

  // Condition indicators
  const conditionPatterns = [
    /\bif\s+([^,.]+)/g,
    /\bwhen\s+([^,.]+)/g,
    /\bmust\s+([^,.]+)/g,
    /\bshould\s+([^,.]+)/g,
    /\brequires?\s+([^,.]+)/g
  ];

  // Validation rules
  const validationPatterns = [
    /\b(valid|invalid)\s+([^,.]+)/g,
    /\b(required|mandatory|optional)\s+([^,.]+)/g,
    /\b(maximum|minimum|at least|at most)\s+([^,.]+)/g,
    /\b(format|pattern|type)\s+([^,.]+)/g,
    /\b(validate|verify|check)\s+([^,.]+)/g
  ];

  // System components
  const componentPatterns = [
    /\b(system|module|component|interface|api|service|database|server|client)\s+([^,.]+)/g,
    /\b(page|screen|form|button|field|menu|tab)\s+([^,.]+)/g,
    /\b(report|dashboard|view|panel)\s+([^,.]+)/g
  ];

  // Data elements
  const dataPatterns = [
    /\b(data|input|output|value|parameter)\s+([^,.]+)/g,
    /\b(file|document|record|entry)\s+([^,.]+)/g,
    /\b(name|id|code|status|type)\s+([^,.]+)/g
  ];

  // Extract matches for each pattern
  actionPatterns.forEach(pattern => {
    const matches = combinedText.match(pattern);
    if (matches) {
      analysis.actions.push(...matches.map(m => m.trim()));
    }
  });

  conditionPatterns.forEach(pattern => {
    const matches = combinedText.match(pattern);
    if (matches) {
      analysis.conditions.push(...matches.map(m => m.trim()));
    }
  });

  validationPatterns.forEach(pattern => {
    const matches = combinedText.match(pattern);
    if (matches) {
      analysis.validations.push(...matches.map(m => m.trim()));
    }
  });

  componentPatterns.forEach(pattern => {
    const matches = combinedText.match(pattern);
    if (matches) {
      analysis.systemComponents.push(...matches.map(m => m.trim()));
    }
  });

  dataPatterns.forEach(pattern => {
    const matches = combinedText.match(pattern);
    if (matches) {
      analysis.dataElements.push(...matches.map(m => m.trim()));
    }
  });

  return analysis;
};

const extractRequirementSteps = (description: string): RequirementStep[] => {
  // Clean and normalize the description
  const normalizedDesc = description
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .toLowerCase();

  const steps: RequirementStep[] = [];
  
  // Split by common delimiters and clean lines
  const lines = description
    .split(/[.\n;]/)
    .map(line => line.trim())
    .filter(line => line.length > 10); // Filter out very short lines

  // Enhanced patterns for different requirement formats
  const patterns = {
    userStory: /as\s+(?:a|an)\s+(.+?),?\s+i\s+want\s+to\s+(.+?)(?:\s+so\s+that\s+(.+))?/i,
    givenWhenThen: /given\s+(.+?),?\s*when\s+(.+?),?\s*then\s+(.+)/i,
    action: /(?:user|system|application)\s+(?:can|should|must|will|shall)\s+(.+)/i,
    functionality: /(?:the\s+)?(?:system|application|feature)\s+(?:allows|enables|provides|supports)\s+(.+)/i,
    acceptance: /acceptance\s+criteria?:?\s*(.+)/i,
    scenario: /scenario:?\s*(.+)/i
  };

  // Process the full description first for user story format
  const userStoryMatch = normalizedDesc.match(patterns.userStory);
  if (userStoryMatch) {
    const role = userStoryMatch[1];
    const action = userStoryMatch[2];
    const benefit = userStoryMatch[3];
    
    steps.push({
      action: `User (${role}) performs ${action}`,
      condition: 'user story',
      expected: benefit || 'Feature works as expected'
    });
  }

  // Process individual lines
  lines.forEach((line, index) => {
    const cleanLine = line.trim();
    if (cleanLine.length === 0) return;

    // Skip if this line was already processed as part of user story
    if (userStoryMatch && cleanLine.toLowerCase().includes('as a') && 
        cleanLine.toLowerCase().includes('i want')) return;

    // Given-When-Then format
    const gwtMatch = cleanLine.match(patterns.givenWhenThen);
    if (gwtMatch) {
      steps.push({
        action: gwtMatch[2], // when part
        condition: gwtMatch[1], // given part
        expected: gwtMatch[3] // then part
      });
      return;
    }

    // Handle different line types
    if (cleanLine.toLowerCase().startsWith('given ')) {
      const condition = cleanLine.substring(6);
      steps.push({
        action: `Setup: ${condition}`,
        condition: 'precondition'
      });
    } else if (cleanLine.toLowerCase().startsWith('when ')) {
      const action = cleanLine.substring(5);
      steps.push({
        action: action,
        condition: 'when'
      });
    } else if (cleanLine.toLowerCase().startsWith('then ')) {
      const expected = cleanLine.substring(5);
      steps.push({
        action: `Verify: ${expected}`,
        validation: 'validate',
        expected: expected
      });
    } else if (cleanLine.toLowerCase().includes('acceptance criteria')) {
      const criteria = cleanLine.replace(/acceptance\s+criteria?:?\s*/i, '');
      if (criteria.length > 0) {
        steps.push({
          action: criteria,
          validation: 'validate'
        });
      }
    } else if (cleanLine.toLowerCase().includes('scenario')) {
      const scenario = cleanLine.replace(/scenario:?\s*/i, '');
      if (scenario.length > 0) {
        steps.push({
          action: scenario,
          condition: 'scenario'
        });
      }
    } else {
      // General action detection
      const actionMatch = cleanLine.match(patterns.action);
      const functionalityMatch = cleanLine.match(patterns.functionality);
      
      if (actionMatch) {
        steps.push({
          action: actionMatch[1],
          validation: cleanLine.includes('validate') || cleanLine.includes('verify') ? 'validate' : undefined
        });
      } else if (functionalityMatch) {
        steps.push({
          action: functionalityMatch[1],
        });
      } else if (cleanLine.length > 0 && !cleanLine.toLowerCase().includes('user story')) {
        // Default case - treat as action
        steps.push({
          action: cleanLine
        });
      }
    }
  });

  // If no steps found, create basic steps from the description
  if (steps.length === 0) {
    // Try to extract key actions from the description
    const words = description.toLowerCase().split(/\s+/);
    const actionWords = ['search', 'find', 'display', 'show', 'enter', 'click', 'select', 'navigate', 'access', 'view'];
    
    actionWords.forEach(actionWord => {
      if (words.includes(actionWord)) {
        const context = description.substring(
          Math.max(0, description.toLowerCase().indexOf(actionWord) - 20),
          description.toLowerCase().indexOf(actionWord) + 50
        );
        steps.push({
          action: `Perform ${actionWord} functionality as described: ${context.trim()}`
        });
      }
    });
  }

  return steps.length > 0 ? steps : [{
    action: 'Test the functionality described in the requirement',
    validation: 'validate'
  }];
};

const createTestCase = (requirement: UploadedRequirement, steps: RequirementStep[]): TestCase => {
  // Determine test case title based on first step and requirement content
  const mainAction = steps[0].action;
  const requirementLower = requirement.description.toLowerCase();
  
  // Create a test case with a clear structure similar to the sample
  const testCase: TestCase = {
    id: `TC_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: `Verify ${mainAction}`,
    description: `Test case to verify ${mainAction.toLowerCase()}`,
    type: 'Functional',
    priority: 'High',
    status: 'Draft',
    requirementId: requirement.id,
    prerequisites: getPrerequisites('search'),
    steps: [],
    expectedResults: 'All test steps complete successfully and functionality works as expected'
  };

  // Add standard setup step
  testCase.steps.push({
    number: 1,
    description: 'Navigate to the application',
    expectedResult: 'Application is accessible and ready for testing'
  });

  // Convert requirement steps to test steps
  let stepNumber = 2;
  
  // Group similar actions together
  const actionGroups: { [key: string]: RequirementStep[] } = {
    input: steps.filter(s => s.action.toLowerCase().includes('enter') || s.action.toLowerCase().includes('input')),
    validation: steps.filter(s => s.validation || s.action.toLowerCase().includes('verify') || s.action.toLowerCase().includes('validate')),
    action: steps.filter(s => !s.validation && !s.action.toLowerCase().includes('enter') && !s.action.toLowerCase().includes('input'))
  };

  // Add input steps
  actionGroups.input.forEach(step => {
    testCase.steps.push({
      number: stepNumber++,
      description: `Enter ${step.action}`,
      expectedResult: `Data is entered correctly and displayed in the input field`
    });
  });

  // Add action steps
  actionGroups.action.forEach(step => {
    testCase.steps.push({
      number: stepNumber++,
      description: `Execute: ${step.action}`,
      expectedResult: `Action is completed successfully`
    });
  });

  // Add validation steps
  actionGroups.validation.forEach(step => {
    testCase.steps.push({
      number: stepNumber++,
      description: `Verify ${step.action}`,
      expectedResult: step.expected || `${step.action} is verified successfully`
    });
  });

  // Add final verification step
  testCase.steps.push({
    number: stepNumber,
    description: 'Verify the overall functionality',
    expectedResult: 'All actions completed successfully and results are as expected'
  });

  // Clean up step descriptions
  testCase.steps = testCase.steps.map(step => ({
    ...step,
    description: cleanupStepDescription(step.description),
    expectedResult: cleanupStepDescription(step.expectedResult)
  }));

  return testCase;
};

const cleanupStepDescription = (text: string): string => {
  return text
    .replace(/^Execute:\s+/, '')
    .replace(/^Verify:\s+/, '')
    .replace(/^Ensure:\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const generateTestCases = (requirement: UploadedRequirement): TestCase[] => {
  const testCases: TestCase[] = [];
  
  // Use extracted scenarios to create test cases
  requirement.scenarios?.forEach((scenario, index) => {
    const steps = extractStepsFromScenario(scenario);
    
    const testCase: TestCase = {
      id: `TC_${Date.now()}_${index}`,
      title: getScenarioTitle(scenario),
      description: `Test case to verify: ${scenario.split('\n')[0]}`,
      type: 'Functional',
      priority: 'High',
      status: 'Draft',
      requirementId: requirement.id,
      prerequisites: getPrerequisitesFromScenario(scenario),
      steps: steps,
      expectedResults: getExpectedResultsFromScenario(scenario)
    };

    testCases.push(testCase);
  });

  return testCases;
};

const extractStepsFromScenario = (scenario: string): TestStep[] => {
  const steps: TestStep[] = [];
  const lines = scenario.split('\n').map(line => line.trim());
  let stepNumber = 1;

  lines.forEach(line => {
    if (!line) return;

    // Skip the scenario title/header
    if (line.toLowerCase().includes('scenario:') || 
        line.toLowerCase().includes('test case:')) {
      return;
    }

    // Extract step information
    let description = line;
    let expectedResult = '';

    // Check for "Given" steps
    if (line.toLowerCase().startsWith('given')) {
      description = line;
      expectedResult = 'Prerequisite condition is met';
    }
    // Check for "When" steps
    else if (line.toLowerCase().startsWith('when')) {
      description = line.substring(4).trim();
      expectedResult = 'Action is performed successfully';
    }
    // Check for "Then" steps
    else if (line.toLowerCase().startsWith('then')) {
      description = line.substring(4).trim();
      expectedResult = description;
    }
    // Check for numbered steps
    else if (line.match(/^\d+[\.)]/)) {
      description = line.replace(/^\d+[\.)]\s*/, '');
      
      // Try to extract expected result if it contains "should" or "verify"
      if (description.toLowerCase().includes('should') || 
          description.toLowerCase().includes('verify') ||
          description.toLowerCase().includes('validate')) {
        expectedResult = description;
        description = `Verify ${description.replace(/should\s+/i, '')}`;
      } else {
        expectedResult = `${description} is completed successfully`;
      }
    }

    if (description) {
      steps.push({
        number: stepNumber++,
        description: description,
        expectedResult: expectedResult
      });
    }
  });

  return steps;
};

const getScenarioTitle = (scenario: string): string => {
  const firstLine = scenario.split('\n')[0];
  if (firstLine.toLowerCase().includes('scenario:')) {
    return firstLine.replace(/scenario:\s*/i, '').trim();
  }
  if (firstLine.toLowerCase().includes('test case:')) {
    return firstLine.replace(/test case:\s*/i, '').trim();
  }
  return firstLine.trim();
};

const getPrerequisitesFromScenario = (scenario: string): string => {
  const lines = scenario.split('\n');
  const prerequisites: string[] = [];

  lines.forEach(line => {
    if (line.toLowerCase().startsWith('given') ||
        line.toLowerCase().includes('prerequisite') ||
        line.toLowerCase().includes('precondition')) {
      prerequisites.push(line.replace(/^given\s+/i, '').trim());
    }
  });

  return prerequisites.length > 0 
    ? prerequisites.join('\n')
    : 'Application is accessible and ready for testing';
};

const getExpectedResultsFromScenario = (scenario: string): string => {
  const lines = scenario.split('\n');
  const results: string[] = [];

  lines.forEach(line => {
    if (line.toLowerCase().startsWith('then') ||
        line.toLowerCase().includes('should') ||
        line.toLowerCase().includes('expect')) {
      results.push(line.replace(/^then\s+/i, '').trim());
    }
  });

  return results.length > 0
    ? results.join('\n')
    : 'All test steps complete successfully and functionality works as expected';
};

// Helper functions for different functionality types
const getPrerequisites = (type: string): string => {
  switch (type) {
    case 'search':
      return 'Application is accessible, test data is available, search functionality is enabled';
    case 'authentication':
      return 'Application is accessible, valid user credentials are available';
    case 'payment':
      return 'Application is accessible, test payment methods are configured, user is logged in';
    case 'file':
      return 'Application is accessible, test files are prepared, sufficient storage space available';
    default:
      return 'System is accessible and user has appropriate permissions';
  }
};

const getSetupStep = (type: string): string => {
  switch (type) {
    case 'search':
      return 'Navigate to search interface and verify search functionality is available';
    case 'authentication':
      return 'Navigate to login page and verify login form is displayed';
    case 'payment':
      return 'Navigate to payment section with items in cart';
    case 'file':
      return 'Navigate to file upload interface and prepare test files';
    default:
      return 'Set up test environment with required test data';
  }
};

const getSetupExpectedResult = (type: string): string => {
  switch (type) {
    case 'search':
      return 'Search interface is displayed with search input field and search button';
    case 'authentication':
      return 'Login form is displayed with username/password fields and login button';
    case 'payment':
      return 'Payment interface is displayed with payment options and form fields';
    case 'file':
      return 'File upload interface is displayed with upload button and file selection';
    default:
      return 'Test environment is ready with required data';
  }
};

const getVerificationStep = (type: string): string => {
  switch (type) {
    case 'search':
      return 'Verify search results are accurate and relevant to the search query';
    case 'authentication':
      return 'Verify user is successfully authenticated and redirected appropriately';
    case 'payment':
      return 'Verify payment is processed successfully and confirmation is displayed';
    case 'file':
      return 'Verify file is uploaded successfully and processed correctly';
    default:
      return 'Verify all functionality works as expected';
  }
};

const getVerificationExpectedResult = (type: string): string => {
  switch (type) {
    case 'search':
      return 'Search results match the query criteria and are displayed in proper format';
    case 'authentication':
      return 'User is logged in successfully and has access to authorized features';
    case 'payment':
      return 'Payment is completed successfully with proper confirmation and receipt';
    case 'file':
      return 'File is uploaded, processed, and stored successfully with proper feedback';
    default:
      return 'All functionality meets the specified requirements';
  }
};

const getExpectedResults = (type: string, description: string): string => {
  switch (type) {
    case 'search':
      return 'Search functionality works correctly, returns relevant results, and provides good user experience';
    case 'authentication':
      return 'Authentication process is secure, user-friendly, and functions as expected';
    case 'payment':
      return 'Payment process is secure, reliable, and completes successfully';
    case 'file':
      return 'File operations complete successfully with proper validation and feedback';
    default:
      return 'All test steps complete successfully and meet the requirement criteria';
  }
};

const generateUserStorySteps = (userStoryAction: string, type: string): Array<{description: string, expectedResult: string}> => {
  const steps = [];
  
  if (type === 'search') {
    steps.push(
      {
        description: 'Enter search query in the search input field',
        expectedResult: 'Search query is entered successfully and displayed in input field'
      },
      {
        description: 'Click search button or press Enter to execute search',
        expectedResult: 'Search is initiated and processing indicator is shown if applicable'
      },
      {
        description: 'Review search results displayed',
        expectedResult: 'Search results are displayed in organized format with relevant information'
      }
    );
  } else {
    // Generic steps for other functionality
    steps.push({
      description: `Perform the action: ${userStoryAction}`,
      expectedResult: `Action is completed successfully: ${userStoryAction}`
    });
  }
  
  return steps;
};

interface SeleniumScript {
  fileName: string;
  content: string;
  type: 'Page' | 'Test' | 'Config';
}

const TestDesign: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadedRequirement, setUploadedRequirement] = useState<UploadedRequirement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTestCase, setEditedTestCase] = useState<TestCase | null>(null);
  const [isScriptDialogOpen, setIsScriptDialogOpen] = useState(false);
  const [generatedScripts, setGeneratedScripts] = useState<SeleniumScript[]>([]);

  const handleRequirementUpload = () => {
    if (!uploadedRequirement) {
      setSnackbar({
        open: true,
        message: 'Please upload a requirement file first.',
        severity: 'warning'
      });
      return;
    }

    try {
      // Log the requirement for debugging
      console.log('Processing requirement:', uploadedRequirement);
      console.log('Requirement description length:', uploadedRequirement.description.length);
      console.log('First 100 chars of description:', uploadedRequirement.description.substring(0, 100));
      
      const newTestCases = generateTestCases(uploadedRequirement);
      console.log('Generated test cases count:', newTestCases.length);
      console.log('Generated test cases:', newTestCases);
      
      if (newTestCases.length === 0) {
        setSnackbar({
          open: true,
          message: 'No test cases could be generated. The requirement content might be too short or unclear. Please check the file content.',
          severity: 'warning'
        });
        return;
      }

      setTestCases([...testCases, ...newTestCases]);
      setSnackbar({
        open: true,
        message: `Successfully generated ${newTestCases.length} test case${newTestCases.length > 1 ? 's' : ''} from requirement!`,
        severity: 'success'
      });
      setIsUploadDialogOpen(false);
      setUploadedRequirement(null);
    } catch (error) {
      console.error('Error generating test cases:', error);
      setSnackbar({
        open: true,
        message: `Error generating test cases: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the requirement content.`,
        severity: 'error'
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        // Parse requirement content more effectively
        const lines = content.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        // Extract key components
        const title = lines[0] || file.name.replace(/\.[^/.]+$/, '');
        const description = lines.slice(1).join('\n');

        // Extract test scenarios from description
        const scenarios = extractTestScenarios(description);

        // Create requirement with scenarios
        const requirement: UploadedRequirement = {
          id: `REQ_${Date.now()}`,
          title: title,
          description: description,
          fileName: file.name,
          scenarios: scenarios
        };

        console.log('Created requirement with scenarios:', requirement);
        setUploadedRequirement(requirement);
        
        setSnackbar({
          open: true,
          message: `File "${file.name}" uploaded successfully. Click "Generate Test Cases" to proceed.`,
          severity: 'success'
        });
      };
      
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        setSnackbar({
          open: true,
          message: 'Error reading file content. Please try again.',
          severity: 'error'
        });
      };
      
      reader.readAsText(file);
    }
  };

  // Function to extract test scenarios from requirement text
  const extractTestScenarios = (text: string): string[] => {
    const scenarios: string[] = [];
    const lines = text.split('\n').map(line => line.trim());
    
    let currentScenario = '';
    let isCollectingScenario = false;

    lines.forEach(line => {
      // Check for scenario indicators
      if (line.toLowerCase().includes('scenario:') || 
          line.toLowerCase().includes('test case:') ||
          line.toLowerCase().includes('given') ||
          line.match(/^\d+\.\s*when/i) ||
          line.match(/^\d+\.\s*verify/i) ||
          line.match(/^\d+\.\s*test/i)) {
        
        // Save previous scenario if exists
        if (currentScenario) {
          scenarios.push(currentScenario.trim());
        }
        
        // Start new scenario
        currentScenario = line;
        isCollectingScenario = true;
      }
      // Collect steps for current scenario
      else if (isCollectingScenario && line) {
        currentScenario += '\n' + line;
      }
    });

    // Add last scenario
    if (currentScenario) {
      scenarios.push(currentScenario.trim());
    }

    // If no explicit scenarios found, try to break down by steps
    if (scenarios.length === 0) {
      let currentStep = '';
      lines.forEach(line => {
        if (line.match(/^\d+[\.)]/)) { // Numbered steps
          if (currentStep) scenarios.push(currentStep.trim());
          currentStep = line;
        } else if (currentStep && line) {
          currentStep += '\n' + line;
        } else if (line) {
          currentStep = line;
        }
      });
      if (currentStep) scenarios.push(currentStep.trim());
    }

    return scenarios;
  };

  const generateTestCases = (requirement: UploadedRequirement): TestCase[] => {
    const testCases: TestCase[] = [];
    
    // Use extracted scenarios to create test cases
    requirement.scenarios?.forEach((scenario, index) => {
      const steps = extractStepsFromScenario(scenario);
      
      const testCase: TestCase = {
        id: `TC_${Date.now()}_${index}`,
        title: getScenarioTitle(scenario),
        description: `Test case to verify: ${scenario.split('\n')[0]}`,
        type: 'Functional',
        priority: 'High',
        status: 'Draft',
        requirementId: requirement.id,
        prerequisites: getPrerequisitesFromScenario(scenario),
        steps: steps,
        expectedResults: getExpectedResultsFromScenario(scenario)
      };

      testCases.push(testCase);
    });

    return testCases;
  };

  const extractStepsFromScenario = (scenario: string): TestStep[] => {
    const steps: TestStep[] = [];
    const lines = scenario.split('\n').map(line => line.trim());
    let stepNumber = 1;

    lines.forEach(line => {
      if (!line) return;

      // Skip the scenario title/header
      if (line.toLowerCase().includes('scenario:') || 
          line.toLowerCase().includes('test case:')) {
        return;
      }

      // Extract step information
      let description = line;
      let expectedResult = '';

      // Check for "Given" steps
      if (line.toLowerCase().startsWith('given')) {
        description = line;
        expectedResult = 'Prerequisite condition is met';
      }
      // Check for "When" steps
      else if (line.toLowerCase().startsWith('when')) {
        description = line.substring(4).trim();
        expectedResult = 'Action is performed successfully';
      }
      // Check for "Then" steps
      else if (line.toLowerCase().startsWith('then')) {
        description = line.substring(4).trim();
        expectedResult = description;
      }
      // Check for numbered steps
      else if (line.match(/^\d+[\.)]/)) {
        description = line.replace(/^\d+[\.)]\s*/, '');
        
        // Try to extract expected result if it contains "should" or "verify"
        if (description.toLowerCase().includes('should') || 
            description.toLowerCase().includes('verify') ||
            description.toLowerCase().includes('validate')) {
          expectedResult = description;
          description = `Verify ${description.replace(/should\s+/i, '')}`;
        } else {
          expectedResult = `${description} is completed successfully`;
        }
      }

      if (description) {
        steps.push({
          number: stepNumber++,
          description: description,
          expectedResult: expectedResult
        });
      }
    });

    return steps;
  };

  const getScenarioTitle = (scenario: string): string => {
    const firstLine = scenario.split('\n')[0];
    if (firstLine.toLowerCase().includes('scenario:')) {
      return firstLine.replace(/scenario:\s*/i, '').trim();
    }
    if (firstLine.toLowerCase().includes('test case:')) {
      return firstLine.replace(/test case:\s*/i, '').trim();
    }
    return firstLine.trim();
  };

  const getPrerequisitesFromScenario = (scenario: string): string => {
    const lines = scenario.split('\n');
    const prerequisites: string[] = [];

    lines.forEach(line => {
      if (line.toLowerCase().startsWith('given') ||
          line.toLowerCase().includes('prerequisite') ||
          line.toLowerCase().includes('precondition')) {
        prerequisites.push(line.replace(/^given\s+/i, '').trim());
      }
    });

    return prerequisites.length > 0 
      ? prerequisites.join('\n')
      : 'Application is accessible and ready for testing';
  };

  const getExpectedResultsFromScenario = (scenario: string): string => {
    const lines = scenario.split('\n');
    const results: string[] = [];

    lines.forEach(line => {
      if (line.toLowerCase().startsWith('then') ||
          line.toLowerCase().includes('should') ||
          line.toLowerCase().includes('expect')) {
        results.push(line.replace(/^then\s+/i, '').trim());
      }
    });

    return results.length > 0
      ? results.join('\n')
      : 'All test steps complete successfully and functionality works as expected';
  };

  const handleDeleteTestCase = (id: string) => {
    setTestCases(testCases.filter(tc => tc.id !== id));
  };

  const handleViewTestCase = (testCase: TestCase) => {
    console.log('Viewing test case:', testCase);
    setSelectedTestCase(testCase);
    setEditedTestCase({ ...testCase }); // Create a copy to avoid reference issues
    setIsViewDialogOpen(true);
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    console.log('Starting edit mode');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    console.log('Cancelling edit');
    setIsEditing(false);
    if (selectedTestCase) {
      setEditedTestCase({ ...selectedTestCase }); // Reset to original
    }
  };

  const handleSaveEdit = () => {
    if (!editedTestCase) return;

    setTestCases(prevTestCases =>
      prevTestCases.map(tc =>
        tc.id === editedTestCase.id ? editedTestCase : tc
      )
    );
    setSelectedTestCase(editedTestCase);
    setIsEditing(false);
    setSnackbar({
      open: true,
      message: 'Test case updated successfully!',
      severity: 'success'
    });
  };

  const handleStepChange = (stepNumber: number, field: keyof TestStep, value: string) => {
    if (!editedTestCase) return;

    setEditedTestCase({
      ...editedTestCase,
      steps: editedTestCase.steps.map(step =>
        step.number === stepNumber
          ? { ...step, [field]: value }
          : step
      )
    });
  };

  const handleAddStep = () => {
    if (!editedTestCase) return;

    const newStep: TestStep = {
      number: editedTestCase.steps.length + 1,
      description: '',
      expectedResult: ''
    };

    setEditedTestCase({
      ...editedTestCase,
      steps: [...editedTestCase.steps, newStep]
    });
  };

  const handleDeleteStep = (stepNumber: number) => {
    if (!editedTestCase) return;

    setEditedTestCase({
      ...editedTestCase,
      steps: editedTestCase.steps
        .filter(step => step.number !== stepNumber)
        .map((step, index) => ({
          ...step,
          number: index + 1
        }))
    });
  };

  const filteredTestCases = testCases.filter(tc =>
    tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateSeleniumScripts = (testCase: TestCase): SeleniumScript[] => {
    const scripts: SeleniumScript[] = [];
    const className = testCase.title
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/\s+/g, '');

    // Generate Page Object class based on test case type
    const pageObject = `package com.itap.pages;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.By;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.time.Duration;
import java.util.List;

public class SearchPage {
    private WebDriver driver;
    private WebDriverWait wait;

    @FindBy(name = "q")
    private WebElement searchBox;

    @FindBy(css = "button[type='submit'], input[type='submit']")
    private WebElement searchButton;

    @FindBy(css = ".search-results, #search")
    private WebElement searchResults;

    @FindBy(css = ".search-filters, .filter-options")
    private WebElement filterOptions;

    @FindBy(css = ".search-suggestion, .autocomplete-suggestion")
    private List<WebElement> searchSuggestions;

    @FindBy(css = ".pagination")
    private WebElement pagination;

    @FindBy(css = ".search-result-item, .result-item")
    private List<WebElement> resultItems;

    public SearchPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    public void navigateToSearchPage(String url) {
        driver.get(url);
        wait.until(ExpectedConditions.elementToBeClickable(searchBox));
    }

    public void enterSearchQuery(String query) {
        wait.until(ExpectedConditions.elementToBeClickable(searchBox));
        searchBox.clear();
        searchBox.sendKeys(query);
    }

    public void clickSearchButton() {
        wait.until(ExpectedConditions.elementToBeClickable(searchButton));
        searchButton.click();
    }

    public boolean verifySearchResults() {
        wait.until(ExpectedConditions.visibilityOf(searchResults));
        return searchResults.isDisplayed() && !resultItems.isEmpty();
    }

    public void clickFilterOption(String filterName) {
        wait.until(ExpectedConditions.elementToBeClickable(filterOptions));
        driver.findElements(By.cssSelector(".filter-option"))
            .stream()
            .filter(element -> element.getText().equalsIgnoreCase(filterName))
            .findFirst()
            .ifPresent(WebElement::click);
    }

    public boolean verifySearchSuggestions() {
        wait.until(ExpectedConditions.visibilityOfAllElements(searchSuggestions));
        return !searchSuggestions.isEmpty();
    }

    public void selectSearchSuggestion(String suggestion) {
        wait.until(ExpectedConditions.visibilityOfAllElements(searchSuggestions));
        searchSuggestions.stream()
            .filter(element -> element.getText().contains(suggestion))
            .findFirst()
            .ifPresent(WebElement::click);
    }

    public void navigateToNextPage() {
        wait.until(ExpectedConditions.elementToBeClickable(pagination));
        WebElement nextButton = driver.findElement(By.cssSelector(".next-page, .next"));
        nextButton.click();
    }

    public void clickResultItem(int index) {
        wait.until(ExpectedConditions.visibilityOfAllElements(resultItems));
        if (index < resultItems.size()) {
            resultItems.get(index).click();
        }
    }

    public int getResultCount() {
        wait.until(ExpectedConditions.visibilityOfAllElements(resultItems));
        return resultItems.size();
    }
}`;

    // Generate Test class based on test case steps
    const testClass = `package com.itap.tests;

import org.testng.annotations.*;
import org.openqa.selenium.WebDriver;
import org.testng.Assert;
import com.itap.pages.SearchPage;
import com.itap.utils.TestBase;

public class ${className}Test extends TestBase {
    private SearchPage searchPage;

    @BeforeClass
    public void setUp() {
        searchPage = new SearchPage(driver);
    }

    @Test(description = "${testCase.description}")
    public void ${className.toLowerCase()}Test() {
        // Test Prerequisites
        ${testCase.prerequisites.split('\n').map(p => `// ${p}`).join('\n        ')}

        ${testCase.steps.map(step => `
        // Step ${step.number}: ${step.description}
        ${generateStepCode(step)}
        // Expected: ${step.expectedResult}`).join('\n\n        ')}
    }
}`;

    // Generate Base class with configuration
    const baseClass = `package com.itap.utils;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.testng.annotations.*;
import java.time.Duration;

public class TestBase {
    protected WebDriver driver;
    protected final String BASE_URL = "https://your-search-application-url.com"; // Update with actual URL

    @BeforeTest
    public void initializeDriver() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--start-maximized");
        options.addArguments("--disable-notifications");
        
        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    }

    @AfterTest
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}`;

    scripts.push({
      fileName: `SearchPage.java`,
      content: pageObject,
      type: 'Page'
    });

    scripts.push({
      fileName: `${className}Test.java`,
      content: testClass,
      type: 'Test'
    });

    scripts.push({
      fileName: 'TestBase.java',
      content: baseClass,
      type: 'Config'
    });

    return scripts;
  };

  const generateStepCode = (step: TestStep): string => {
    const stepLower = step.description.toLowerCase();
    
    // Navigation steps
    if (stepLower.includes('navigate') || stepLower.includes('open')) {
      return 'searchPage.navigateToSearchPage(BASE_URL);';
    }
    
    // Input steps
    if (stepLower.includes('enter') || stepLower.includes('type')) {
      return 'searchPage.enterSearchQuery("your search query"); // Update with actual search query';
    }
    
    // Click steps
    if (stepLower.includes('click')) {
      if (stepLower.includes('search button')) {
        return 'searchPage.clickSearchButton();';
      }
      if (stepLower.includes('filter')) {
        return 'searchPage.clickFilterOption("desired filter"); // Update with actual filter name';
      }
      if (stepLower.includes('result')) {
        return 'searchPage.clickResultItem(0); // Click first result';
      }
    }
    
    // Verification steps
    if (stepLower.includes('verify')) {
      if (stepLower.includes('results')) {
        return 'Assert.assertTrue(searchPage.verifySearchResults(), "Search results should be displayed");';
      }
      if (stepLower.includes('suggestion')) {
        return 'Assert.assertTrue(searchPage.verifySearchSuggestions(), "Search suggestions should be displayed");';
      }
      if (stepLower.includes('filter')) {
        return 'Assert.assertTrue(searchPage.getResultCount() > 0, "Filtered results should be displayed");';
      }
    }
    
    // Navigation steps
    if (stepLower.includes('next page')) {
      return 'searchPage.navigateToNextPage();';
    }
    
    // Suggestion steps
    if (stepLower.includes('select suggestion')) {
      return 'searchPage.selectSearchSuggestion("suggested text"); // Update with actual suggestion text';
    }

    return `// TODO: Implement step - ${step.description}`;
  };

  // Add handler for script generation
  const handleGenerateScript = (testCase: TestCase) => {
    const scripts = generateSeleniumScripts(testCase);
    setGeneratedScripts(scripts);
    setIsScriptDialogOpen(true);
  };

  // Add new function to save test case to file
  const handleSaveToFiles = async (testCase: TestCase) => {
    try {
      const scripts = generateSeleniumScripts(testCase);
      const result = await saveFiles(testCase, scripts);
      
      if (result.success) {
        console.log('Files saved:', result.files);
        setSnackbar({
          open: true,
          message: `Test case and scripts saved successfully! Files: ${result.files?.join(', ')}`,
          severity: 'success'
        });
      } else {
        throw result.error || new Error(result.message);
      }
    } catch (error) {
      console.error('Error saving files:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        severity: 'error'
      });
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Test Design
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Test Cases" />
              <Tab label="Test Suites" />
              <Tab label="Templates" />
            </Tabs>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Search Test Cases"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                sx={{ minWidth: '200px' }}
                onClick={() => setIsUploadDialogOpen(true)}
              >
                Upload Requirement
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ minWidth: '150px' }}
                onClick={() => {
                  // Add a sample test case for debugging
                  const sampleTestCase: TestCase = {
                    id: `TC_SAMPLE_${Date.now()}`,
                    title: 'Sample Search Test Case',
                    description: 'Sample test case for Google search functionality',
                    type: 'Functional',
                    priority: 'High',
                    status: 'Draft',
                    requirementId: 'REQ_SAMPLE',
                    prerequisites: 'Browser is open and Google search page is accessible',
                    steps: [
                      {
                        number: 1,
                        description: 'Navigate to Google search page',
                        expectedResult: 'Google search page loads successfully'
                      },
                      {
                        number: 2,
                        description: 'Enter search query in search box',
                        expectedResult: 'Search query is entered and displayed'
                      },
                      {
                        number: 3,
                        description: 'Click search button or press Enter',
                        expectedResult: 'Search results are displayed'
                      }
                    ],
                    expectedResults: 'Search functionality works correctly and returns relevant results'
                  };
                  setTestCases([...testCases, sampleTestCase]);
                  setSnackbar({
                    open: true,
                    message: 'Sample test case added for demonstration',
                    severity: 'info'
                  });
                }}
              >
                Add Sample
              </Button>
            </Box>
            {testCases.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No test cases created yet
                </Typography>
                <Typography color="text.secondary">
                  Upload a requirement to automatically generate test cases
                </Typography>
              </Box>
            ) : (
              <List>
                {filteredTestCases.map((tc) => (
                  <React.Fragment key={tc.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DescriptionIcon color="primary" />
                            <Typography variant="h6">{tc.title}</Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.primary" paragraph>
                              {tc.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip
                                label={`Type: ${tc.type}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label={`Priority: ${tc.priority}`}
                                size="small"
                                color={tc.priority === 'High' ? 'error' : tc.priority === 'Medium' ? 'warning' : 'info'}
                              />
                              <Chip
                                label={`Status: ${tc.status}`}
                                size="small"
                                color={tc.status === 'Approved' ? 'success' : 'default'}
                              />
                              {tc.requirementId && (
                                <Chip
                                  icon={<AutoAwesomeIcon />}
                                  label="Auto-generated"
                                  size="small"
                                  color="secondary"
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="generate script"
                          sx={{ mr: 1 }}
                          onClick={() => handleGenerateScript(tc)}
                        >
                          <CodeIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          sx={{ mr: 1 }}
                          onClick={() => handleViewTestCase(tc)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteTestCase(tc.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Upload Requirement Dialog */}
      <Dialog
        open={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Requirement</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography paragraph>
              Upload a requirement document to automatically generate test cases.
              The system will analyze the requirement and create appropriate test cases.
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Select File
              <input
                type="file"
                hidden
                onChange={handleFileUpload}
                accept=".doc,.docx,.pdf,.txt"
              />
            </Button>
            {uploadedRequirement && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Selected file: {uploadedRequirement.fileName}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRequirementUpload}
            variant="contained"
            disabled={!uploadedRequirement}
            startIcon={<AutoAwesomeIcon />}
          >
            Generate Test Cases
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Case View/Edit Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setIsEditing(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Edit Test Case' : 'Test Case Details'}
          {selectedTestCase?.requirementId && (
            <Chip
              icon={<AutoAwesomeIcon />}
              label="Auto-generated"
              size="small"
              color="secondary"
              sx={{ ml: 1 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {editedTestCase && (
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="ID"
                  value={editedTestCase.id}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={editedTestCase.type}
                    label="Type"
                    onChange={(e) => setEditedTestCase({
                      ...editedTestCase,
                      type: e.target.value as TestCase['type']
                    })}
                    disabled={!isEditing}
                  >
                    <MenuItem value="Functional">Functional</MenuItem>
                    <MenuItem value="Integration">Integration</MenuItem>
                    <MenuItem value="Performance">Performance</MenuItem>
                    <MenuItem value="Security">Security</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <TextField
                label="Title"
                value={editedTestCase.title}
                fullWidth
                onChange={(e) => setEditedTestCase({
                  ...editedTestCase,
                  title: e.target.value
                })}
                InputProps={{ readOnly: !isEditing }}
              />
              <TextField
                label="Description"
                value={editedTestCase.description}
                multiline
                rows={3}
                fullWidth
                onChange={(e) => setEditedTestCase({
                  ...editedTestCase,
                  description: e.target.value
                })}
                InputProps={{ readOnly: !isEditing }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={editedTestCase.priority}
                    label="Priority"
                    onChange={(e) => setEditedTestCase({
                      ...editedTestCase,
                      priority: e.target.value as TestCase['priority']
                    })}
                    disabled={!isEditing}
                  >
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editedTestCase.status}
                    label="Status"
                    onChange={(e) => setEditedTestCase({
                      ...editedTestCase,
                      status: e.target.value as TestCase['status']
                    })}
                    disabled={!isEditing}
                  >
                    <MenuItem value="Draft">Draft</MenuItem>
                    <MenuItem value="Review">Review</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <TextField
                label="Prerequisites"
                value={editedTestCase.prerequisites}
                multiline
                rows={2}
                fullWidth
                onChange={(e) => setEditedTestCase({
                  ...editedTestCase,
                  prerequisites: e.target.value
                })}
                InputProps={{ readOnly: !isEditing }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Test Steps</Typography>
                {isEditing && (
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddStep}
                    variant="outlined"
                    size="small"
                  >
                    Add Step
                  </Button>
                )}
              </Box>
              <Paper variant="outlined" sx={{ p: 2 }}>
                {editedTestCase.steps.map((step) => (
                  <Box key={step.number} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1">
                        Step {step.number}
                      </Typography>
                      {isEditing && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteStep(step.number)}
                          disabled={editedTestCase.steps.length <= 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <TextField
                      label="Description"
                      value={step.description}
                      fullWidth
                      multiline
                      onChange={(e) => handleStepChange(step.number, 'description', e.target.value)}
                      InputProps={{ readOnly: !isEditing }}
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      label="Expected Result"
                      value={step.expectedResult}
                      fullWidth
                      multiline
                      onChange={(e) => handleStepChange(step.number, 'expectedResult', e.target.value)}
                      InputProps={{ readOnly: !isEditing }}
                    />
                    {step.number < editedTestCase.steps.length && (
                      <Divider sx={{ my: 2 }} />
                    )}
                  </Box>
                ))}
              </Paper>
              <TextField
                label="Expected Results"
                value={editedTestCase.expectedResults}
                multiline
                rows={2}
                fullWidth
                onChange={(e) => setEditedTestCase({
                  ...editedTestCase,
                  expectedResults: e.target.value
                })}
                InputProps={{ readOnly: !isEditing }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {isEditing ? (
            <>
              <Button onClick={handleCancelEdit}>Cancel</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveEdit}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => selectedTestCase && handleSaveToFiles(selectedTestCase)}
              >
                Save to Files
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={handleStartEditing}
              >
                Edit Test Case
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Generated Selenium Scripts Dialog */}
      <Dialog
        open={isScriptDialogOpen}
        onClose={() => setIsScriptDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Generated Selenium Test Scripts</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {generatedScripts.map((script, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {script.fileName}
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'grey.900',
                    color: 'common.white',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: '400px'
                  }}
                >
                  <pre style={{ margin: 0 }}>{script.content}</pre>
                </Paper>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsScriptDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedTestCase) {
                handleSaveToFiles(selectedTestCase);
              }
              setIsScriptDialogOpen(false);
            }}
          >
            Save All Files
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TestDesign; 