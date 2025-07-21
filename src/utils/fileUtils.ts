export interface SaveResult {
  success: boolean;
  message: string;
  files?: string[];
  error?: Error;
}

export const saveFiles = async (
  testCase: any,
  scripts: Array<{ fileName: string; content: string }>,
  baseDir: string = 'artifacts/test cases'
): Promise<SaveResult> => {
  try {
    // Request permission to access file system
    const dirHandle = await window.showDirectoryPicker({
      startIn: 'documents',
      mode: 'readwrite'
    });

    // Create artifacts directory
    let artifactsHandle = dirHandle;
    for (const part of baseDir.split('/')) {
      artifactsHandle = await artifactsHandle.getDirectoryHandle(part, { create: true });
    }

    // Save test case JSON
    const testCaseJson = JSON.stringify(testCase, null, 2);
    const fileName = `${testCase.title.replace(/[^a-zA-Z0-9]/g, '_')}_TestCase.json`;
    const testCaseFile = await artifactsHandle.getFileHandle(fileName, { create: true });
    const testCaseWriter = await testCaseFile.createWritable();
    await testCaseWriter.write(testCaseJson);
    await testCaseWriter.close();

    // Save scripts
    const savedFiles = [fileName];
    for (const script of scripts) {
      const fileHandle = await artifactsHandle.getFileHandle(script.fileName, { create: true });
      const writer = await fileHandle.createWritable();
      await writer.write(script.content);
      await writer.close();
      savedFiles.push(script.fileName);
    }

    return {
      success: true,
      message: 'Files saved successfully',
      files: savedFiles
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
    return {
      success: false,
      message: 'An unknown error occurred while saving files',
      error: new Error('Unknown error')
    };
  }
}; 