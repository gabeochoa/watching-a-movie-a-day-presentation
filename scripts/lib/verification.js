/**
 * Verification helpers for slide patching
 * 
 * Creates structural fingerprints of HTML to ensure only numeric values changed.
 */

/**
 * Create a structural fingerprint of HTML content.
 * Replaces all numbers with placeholders so we can compare structure without values.
 */
export function createStructuralFingerprint(html) {
  // Replace all numeric patterns with placeholders
  return html
    // Replace decimal numbers (e.g., 27.1)
    .replace(/\d+\.\d+/g, '{{DECIMAL}}')
    // Replace integer numbers
    .replace(/\d+/g, '{{NUMBER}}')
    // Normalize whitespace for comparison
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verify that two fingerprints are structurally identical.
 * Returns true if only numbers changed, false if structure changed.
 */
export function verifyStructure(originalFingerprint, newFingerprint) {
  return originalFingerprint === newFingerprint;
}

/**
 * Get a diff of what changed between two HTML strings.
 * Returns an array of change descriptions.
 */
export function getDiff(original, updated) {
  const changes = [];
  
  // Simple line-by-line comparison
  const originalLines = original.split('\n');
  const updatedLines = updated.split('\n');
  
  for (let i = 0; i < Math.max(originalLines.length, updatedLines.length); i++) {
    const origLine = originalLines[i] || '';
    const updLine = updatedLines[i] || '';
    
    if (origLine !== updLine) {
      // Extract the specific numeric changes
      const origNumbers = origLine.match(/\d+\.?\d*/g) || [];
      const updNumbers = updLine.match(/\d+\.?\d*/g) || [];
      
      if (origNumbers.length === updNumbers.length) {
        for (let j = 0; j < origNumbers.length; j++) {
          if (origNumbers[j] !== updNumbers[j]) {
            changes.push({
              line: i + 1,
              from: origNumbers[j],
              to: updNumbers[j],
            });
          }
        }
      } else {
        // Structure might have changed
        changes.push({
          line: i + 1,
          type: 'structural',
          from: origLine.trim().substring(0, 80),
          to: updLine.trim().substring(0, 80),
        });
      }
    }
  }
  
  return changes;
}

/**
 * Format a patch report for console output.
 */
export function formatPatchReport(results) {
  const lines = [];
  
  for (const result of results) {
    lines.push(`${result.file}:`);
    lines.push(`  ${result.structureValid ? '✓' : '✗'} Structure ${result.structureValid ? 'unchanged' : 'CHANGED!'}`);
    
    if (result.changes.length > 0) {
      lines.push('  Changes:');
      for (const change of result.changes) {
        if (change.type === 'structural') {
          lines.push(`    ⚠️ Line ${change.line}: Structural change detected`);
        } else {
          lines.push(`    - "${change.from}" → "${change.to}"`);
        }
      }
    } else {
      lines.push('  No changes');
    }
    
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Validate that a patch only changed numbers by checking before/after.
 */
export function validateNumericOnlyChange(original, updated) {
  // Create fingerprints
  const origFp = createStructuralFingerprint(original);
  const updFp = createStructuralFingerprint(updated);
  
  if (origFp !== updFp) {
    return {
      valid: false,
      reason: 'Structural changes detected beyond numeric values',
    };
  }
  
  // Check that something actually changed if content is different
  if (original === updated) {
    return {
      valid: true,
      reason: 'No changes made',
    };
  }
  
  return {
    valid: true,
    reason: 'Only numeric values changed',
  };
}

