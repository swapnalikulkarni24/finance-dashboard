// frontend/src/components/CsvExportModal.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  FormGroup,
  Paper, // <-- ADDED THIS IMPORT
} from '@mui/material';
import { Close as CloseIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material'; // <-- CORRECTED IMPORT

interface CsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (selectedColumns: string[]) => void;
  availableColumns: { label: string; value: string }[];
  isExporting: boolean;
  exportError: string | null;
}

const CsvExportModal: React.FC<CsvExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  availableColumns,
  isExporting,
  exportError,
}) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    availableColumns.map(col => col.value) // Default to all columns selected
  );

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedColumns(prev => [...prev, value]);
    } else {
      setSelectedColumns(prev => prev.filter(col => col !== value));
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedColumns(availableColumns.map(col => col.value));
    } else {
      setSelectedColumns([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExport(selectedColumns);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>Configure CSV Export</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        {exportError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{exportError}</Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
            Select Columns to Export:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, maxHeight: 250, overflowY: 'auto', mb: 3, borderRadius: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedColumns.length === availableColumns.length && availableColumns.length > 0}
                  onChange={handleSelectAll}
                  indeterminate={selectedColumns.length > 0 && selectedColumns.length < availableColumns.length}
                />
              }
              label={<Typography variant="body1" sx={{ fontWeight: 'bold' }}>Select All</Typography>}
              sx={{ mb: 1, borderBottom: '1px solid #eee', pb: 1, display: 'block' }}
            />
            <FormGroup>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                {availableColumns.map(column => (
                  <FormControlLabel
                    key={column.value}
                    control={
                      <Checkbox
                        value={column.value}
                        checked={selectedColumns.includes(column.value)}
                        onChange={handleCheckboxChange}
                      />
                    }
                    label={column.label}
                  />
                ))}
              </Box>
            </FormGroup>
          </Paper>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={selectedColumns.length === 0 || isExporting}
            startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
            sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
          >
            Export to CSV
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CsvExportModal;
