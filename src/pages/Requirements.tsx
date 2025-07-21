import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Snackbar,
  Alert,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

interface UploadedRequirement {
  id: string;
  title: string;
  description: string;
  fileName: string;
  uploadDate: string;
  investAssessment?: InvestAssessment;
}

interface InvestAssessment {
  independent: number;
  negotiable: number;
  valuable: number;
  estimable: number;
  small: number;
  testable: number;
  averageScore: number;
  feedback: string[];
}

interface AutoScoreRule {
  criterion: keyof Omit<InvestAssessment, 'averageScore' | 'feedback'>;
  patterns: {
    regex: RegExp;
    score: number;
    reason: string;
  }[];
}

const SCORING_RULES: AutoScoreRule[] = [
  {
    criterion: 'independent',
    patterns: [
      {
        regex: /depends|dependency|dependent|requires|prerequisite|after|before|following/i,
        score: -1,
        reason: 'Contains dependency-related terms'
      },
      {
        regex: /standalone|independent|self-contained|autonomous/i,
        score: 1,
        reason: 'Indicates independence'
      }
    ]
  },
  {
    criterion: 'negotiable',
    patterns: [
      {
        regex: /must|shall|always|never|exactly|specific|specified|required/i,
        score: -1,
        reason: 'Contains rigid/inflexible terms'
      },
      {
        regex: /could|should|may|optionally|preferably|flexible|suggest/i,
        score: 1,
        reason: 'Uses flexible language'
      }
    ]
  },
  {
    criterion: 'valuable',
    patterns: [
      {
        regex: /benefit|value|improve|enhance|enable|help|solve|optimize|user|customer|stakeholder/i,
        score: 1,
        reason: 'Clearly states value or benefits'
      },
      {
        regex: /ROI|revenue|efficiency|performance|quality|experience/i,
        score: 1,
        reason: 'References business value'
      }
    ]
  },
  {
    criterion: 'estimable',
    patterns: [
      {
        regex: /measurable|quantifiable|specific|clear|defined|scope/i,
        score: 1,
        reason: 'Contains measurable terms'
      },
      {
        regex: /vague|unclear|undefined|somehow|maybe|sometime|eventually/i,
        score: -1,
        reason: 'Contains vague terms'
      }
    ]
  },
  {
    criterion: 'small',
    patterns: [
      {
        regex: /and|also|additionally|moreover|furthermore|plus|including|multiple|various/i,
        score: -1,
        reason: 'Indicates multiple components'
      },
      {
        regex: /simple|single|specific|focused|one|particular/i,
        score: 1,
        reason: 'Indicates focused scope'
      }
    ]
  },
  {
    criterion: 'testable',
    patterns: [
      {
        regex: /verifiable|testable|measurable|validate|verify|test|check|assert|confirm/i,
        score: 1,
        reason: 'Contains verification terms'
      },
      {
        regex: /when|if|then|should|will|must|can|successfully/i,
        score: 1,
        reason: 'Includes conditional/validation terms'
      }
    ]
  }
];

const calculateAutoScore = (title: string, description: string): {
  scores: Record<string, number>;
  reasons: Record<string, string[]>;
} => {
  const combinedText = `${title} ${description}`;
  const scores: Record<string, number> = {};
  const reasons: Record<string, string[]> = {};

  SCORING_RULES.forEach(rule => {
    let score = 3; // Start with a neutral score
    const criterionReasons: string[] = [];

    rule.patterns.forEach(pattern => {
      const matches = (combinedText.match(pattern.regex) || []).length;
      if (matches > 0) {
        score += pattern.score;
        criterionReasons.push(`${pattern.reason} (${matches} matches)`);
      }
    });

    // Normalize score between 1 and 5
    score = Math.max(1, Math.min(5, score));
    scores[rule.criterion] = score;
    reasons[rule.criterion] = criterionReasons;
  });

  return { scores, reasons };
};

const INVEST_CRITERIA = [
  {
    name: 'independent',
    title: 'Independent',
    description: 'Can this requirement be developed and delivered independently?',
    tips: [
      'Should not have dependencies on other requirements',
      'Can be implemented in any order',
      'Stands alone in delivering value'
    ]
  },
  {
    name: 'negotiable',
    title: 'Negotiable',
    description: 'Is there room for discussion and refinement?',
    tips: [
      'Not too rigidly detailed',
      'Open to discussion and changes',
      'Allows for different implementation approaches'
    ]
  },
  {
    name: 'valuable',
    title: 'Valuable',
    description: 'Does it provide clear value to stakeholders?',
    tips: [
      'Clear business or user value',
      'Solves a real problem',
      'Benefits are clearly stated'
    ]
  },
  {
    name: 'estimable',
    title: 'Estimable',
    description: 'Can the effort be estimated?',
    tips: [
      'Clear enough to estimate',
      'Has enough detail for planning',
      'Technical implications are understood'
    ]
  },
  {
    name: 'small',
    title: 'Small',
    description: 'Is it small enough to plan and prioritize?',
    tips: [
      'Can be completed in one iteration',
      'Not too large or complex',
      'Can be easily understood'
    ]
  },
  {
    name: 'testable',
    title: 'Testable',
    description: 'Can it be verified and tested?',
    tips: [
      'Has clear acceptance criteria',
      'Can be verified objectively',
      'Results can be validated'
    ]
  }
];

const Requirements: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedRequirement[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [assessmentDialog, setAssessmentDialog] = useState<{
    open: boolean;
    requirement?: UploadedRequirement;
  }>({
    open: false,
  });
  const [currentAssessment, setCurrentAssessment] = useState<Partial<InvestAssessment>>({});
  const [assessmentReasons, setAssessmentReasons] = useState<Record<string, string[]>>({});

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setCurrentFile(event.target.files[0]);
    }
  };

  const calculateInvestScore = (assessment: Partial<InvestAssessment>): InvestAssessment => {
    const scores = INVEST_CRITERIA.map(criteria => 
      Number(assessment[criteria.name as keyof InvestAssessment]) || 0
    );
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    const feedback: string[] = [];
    
    if (assessment.independent && assessment.independent < 3) {
      feedback.push('Consider reducing dependencies on other requirements');
    }
    if (assessment.negotiable && assessment.negotiable < 3) {
      feedback.push('Make the requirement more flexible and open to discussion');
    }
    if (assessment.valuable && assessment.valuable < 3) {
      feedback.push('Clarify the business value and benefits');
    }
    if (assessment.estimable && assessment.estimable < 3) {
      feedback.push('Add more details to make estimation possible');
    }
    if (assessment.small && assessment.small < 3) {
      feedback.push('Consider breaking down into smaller pieces');
    }
    if (assessment.testable && assessment.testable < 3) {
      feedback.push('Add clear acceptance criteria');
    }

    return {
      independent: Number(assessment.independent) || 0,
      negotiable: Number(assessment.negotiable) || 0,
      valuable: Number(assessment.valuable) || 0,
      estimable: Number(assessment.estimable) || 0,
      small: Number(assessment.small) || 0,
      testable: Number(assessment.testable) || 0,
      averageScore,
      feedback
    };
  };

  const handleAssessmentComplete = async () => {
    if (!assessmentDialog.requirement) return;

    const assessment = calculateInvestScore(currentAssessment);
    const updatedRequirement = {
      ...assessmentDialog.requirement,
      investAssessment: assessment
    };

    // Update the requirement in the list
    setUploadedFiles(files => 
      files.map(file => 
        file.id === updatedRequirement.id ? updatedRequirement : file
      )
    );

    // Save to Excel with assessment
    await saveToExcel(updatedRequirement);

    setAssessmentDialog({ open: false });
    setCurrentAssessment({});
    
    setSnackbar({
      open: true,
      message: `INVEST Assessment completed! Average score: ${assessment.averageScore.toFixed(1)}/5`,
      severity: 'success'
    });
  };

  const handleUpload = async () => {
    if (!currentFile || !title.trim() || !description.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide title, description and select a file',
        severity: 'error',
      });
      return;
    }

    try {
      const { scores, reasons } = calculateAutoScore(title.trim(), description.trim());
      const scoreValues: number[] = Object.values(scores);
      const averageScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

      const feedback = Object.entries(reasons)
        .filter(([criterion, criterionReasons]) => criterionReasons.length > 0)
        .map(([criterion, criterionReasons]) => {
          const score = scores[criterion] || 0;
          if (score < 3) {
            return `Improve ${criterion}: ${criterionReasons.join(', ')}`;
          }
          return `Strong ${criterion}: ${criterionReasons.join(', ')}`;
        });

      const requirement: UploadedRequirement = {
        id: `REQ${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        fileName: currentFile.name,
        uploadDate: new Date().toISOString().split('T')[0],
        investAssessment: {
          independent: scores.independent || 0,
          negotiable: scores.negotiable || 0,
          valuable: scores.valuable || 0,
          estimable: scores.estimable || 0,
          small: scores.small || 0,
          testable: scores.testable || 0,
          averageScore,
          feedback
        }
      };

      // Save to Excel
      const saved = await saveToExcel(requirement);
      
      if (saved) {
        setUploadedFiles([...uploadedFiles, requirement]);
        setAssessmentReasons(reasons);
        setAssessmentDialog({
          open: true,
          requirement
        });
        
        // Clear form
        setCurrentFile(null);
        setTitle('');
        setDescription('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setSnackbar({
        open: true,
        message: `Error saving requirement: ${errorMessage}`,
        severity: 'error',
      });
    }
  };

  const saveToExcel = async (requirement: UploadedRequirement) => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Basic requirement details
      const basicDetails = [
        ['Requirement Details', ''],
        ['ID:', requirement.id],
        ['Title:', requirement.title],
        ['Description:', requirement.description],
        ['File Name:', requirement.fileName],
        ['Upload Date:', requirement.uploadDate],
        ['', ''],
      ];

      // Add INVEST assessment if available
      if (requirement.investAssessment) {
        basicDetails.push(
          ['INVEST Assessment', ''],
          ['Independent:', requirement.investAssessment.independent + '/5'],
          ['Negotiable:', requirement.investAssessment.negotiable + '/5'],
          ['Valuable:', requirement.investAssessment.valuable + '/5'],
          ['Estimable:', requirement.investAssessment.estimable + '/5'],
          ['Small:', requirement.investAssessment.small + '/5'],
          ['Testable:', requirement.investAssessment.testable + '/5'],
          ['Average Score:', requirement.investAssessment.averageScore.toFixed(1) + '/5'],
          ['', ''],
          ['Feedback:', ''],
          ...requirement.investAssessment.feedback.map(f => ['•', f])
        );
      }
      
      const ws = XLSX.utils.aoa_to_sheet(basicDetails);
      ws['!cols'] = [{ wch: 15 }, { wch: 50 }];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Requirement Details');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `REQ_${requirement.id}_${timestamp}.xlsx`;
      const filepath = `artifacts/requirement/${filename}`;

      XLSX.writeFile(wb, filepath);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error saving to Excel:', errorMessage);
      throw err;
    }
  };

  const handleDelete = (id: string) => {
    setUploadedFiles(uploadedFiles.filter(req => req.id !== id));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getScoreColor = (score: number | undefined) => {
    const numScore = Number(score) || 0;
    if (numScore >= 4) return 'success';
    if (numScore >= 3) return 'info';
    if (numScore >= 2) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Requirements
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Upload Requirement
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Requirement Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label="Requirement Description"
                  multiline
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                  >
                    Select File
                    <input
                      type="file"
                      hidden
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      accept=".doc,.docx,.pdf,.xlsx,.xls"
                    />
                  </Button>
                  {currentFile && (
                    <Typography variant="body2" color="text.secondary">
                      Selected: {currentFile.name}
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleUpload}
                  disabled={!currentFile || !title || !description}
                >
                  Upload & Assess
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Uploaded Requirements
            </Typography>
            {uploadedFiles.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No requirements uploaded yet
                </Typography>
                <Typography color="text.secondary">
                  Upload your first requirement using the form above
                </Typography>
              </Box>
            ) : (
              <List>
                {uploadedFiles.map((req) => (
                  <React.Fragment key={req.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DescriptionIcon color="primary" />
                            <Typography variant="h6">{req.title}</Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.primary" paragraph>
                              {req.description}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                File: {req.fileName}
                                <br />
                                Uploaded: {req.uploadDate}
                              </Typography>
                              {req.investAssessment && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  <Chip
                                    size="small"
                                    color={getScoreColor(Number(req.investAssessment.averageScore))}
                                    label={`INVEST Score: ${Number(req.investAssessment.averageScore).toFixed(1)}/5`}
                                    icon={<AssessmentIcon />}
                                  />
                                  {INVEST_CRITERIA.map(criteria => {
                                    const criteriaScore = Number(req.investAssessment![criteria.name as keyof InvestAssessment]) || 0;
                                    return (
                                      <Tooltip
                                        key={criteria.name}
                                        title={`${criteria.title}: ${criteriaScore}/5`}
                                      >
                                        <Chip
                                          size="small"
                                          variant="outlined"
                                          color={getScoreColor(criteriaScore)}
                                          label={criteria.title.charAt(0)}
                                        />
                                      </Tooltip>
                                    );
                                  })}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDelete(req.id)}
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

      {/* INVEST Assessment Dialog */}
      <Dialog 
        open={assessmentDialog.open} 
        onClose={() => setAssessmentDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          INVEST Criteria Assessment
          {assessmentDialog.requirement && (
            <Typography variant="subtitle1" color="text.secondary">
              {assessmentDialog.requirement.title}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography paragraph>
              Rate how well the requirement meets each INVEST criterion:
            </Typography>
            <Grid container spacing={3}>
              {INVEST_CRITERIA.map(criteria => (
                <Grid item xs={12} key={criteria.name}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {criteria.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {criteria.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Rating
                        value={Number(assessmentDialog.requirement?.investAssessment?.[criteria.name as keyof InvestAssessment]) || 0}
                        onChange={(_, value) => {
                          setCurrentAssessment(prev => ({
                            ...prev,
                            [criteria.name]: value || 0
                          }));
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {assessmentDialog.requirement?.investAssessment?.[criteria.name as keyof InvestAssessment] || 0}/5
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      {criteria.tips.map((tip, index) => (
                        <Typography key={index} variant="body2" color="text.secondary">
                          • {tip}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssessmentDialog({ open: false })}>Cancel</Button>
          <Button 
            onClick={handleAssessmentComplete}
            variant="contained"
            disabled={!Object.keys(currentAssessment).length}
          >
            Complete Assessment
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Requirements; 