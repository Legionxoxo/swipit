import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface CsvUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface JobStatus {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    totalUrls: number;
    processedUrls: number;
    progress: number;
    errorMessage?: string;
}

const CsvUploadModal: React.FC<CsvUploadModalProps> = ({ isOpen, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [parseErrors, setParseErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollIntervalRef = useRef<number | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                setError('Please select a CSV file');
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setParseErrors([]);

        const formData = new FormData();
        formData.append('csv', file);
        formData.append('skipHeader', 'true');
        formData.append('maxRows', '1000');
        formData.append('removeDuplicates', 'true');

        try {
            const response = await fetch('http://localhost:3000/api/csv/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Upload failed');
            }

            setJobId(data.jobId);
            setParseErrors(data.parseErrors || []);
            
            // Start polling for job status
            pollJobStatus(data.jobId);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const pollJobStatus = (jobId: string) => {
        // Clear any existing interval
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }

        // Poll every 2 seconds
        pollIntervalRef.current = window.setInterval(async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/csv/job/${jobId}`);
                const data = await response.json();

                if (data.success && data.job) {
                    setJobStatus(data.job);

                    // Stop polling if job is completed or failed
                    if (data.job.status === 'completed' || data.job.status === 'failed') {
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                        }
                    }
                }
            } catch (err) {
                console.error('Error polling job status:', err);
            }
        }, 2000);
    };

    const downloadResults = async () => {
        if (!jobId) return;

        try {
            const response = await fetch(`http://localhost:3000/api/csv/results/${jobId}?format=csv`);
            
            if (!response.ok) {
                throw new Error('Failed to download results');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `instagram_oembed_results_${jobId}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Download failed');
        }
    };

    const downloadSample = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/csv/sample');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'instagram_urls_sample.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download sample');
        }
    };

    const reset = () => {
        setFile(null);
        setJobId(null);
        setJobStatus(null);
        setError(null);
        setParseErrors([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    };

    React.useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-semibold">Import Instagram URLs from CSV</h2>
                    <button
                        onClick={() => {
                            reset();
                            onClose();
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Instructions */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2">CSV Format</h3>
                        <p className="text-sm text-blue-800 mb-2">
                            Your CSV should have Instagram post URLs in the first column, with an optional tag in the second column.
                        </p>
                        <button
                            onClick={downloadSample}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                            Download sample CSV
                        </button>
                    </div>

                    {/* File Upload */}
                    {!jobId && (
                        <div className="mb-6">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                            >
                                {file ? (
                                    <div className="flex items-center justify-center">
                                        <FileText className="mr-2 text-green-600" size={24} />
                                        <span className="text-gray-700">{file.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                                        <p className="text-gray-600">Click to select CSV file</p>
                                        <p className="text-sm text-gray-400 mt-1">Max 1000 URLs</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start">
                            <AlertCircle className="text-red-600 mr-2 flex-shrink-0" size={20} />
                            <span className="text-red-800">{error}</span>
                        </div>
                    )}

                    {/* Parse Errors */}
                    {parseErrors.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold mb-2">Parse Warnings:</h3>
                            <div className="max-h-32 overflow-y-auto bg-yellow-50 p-3 rounded text-sm">
                                {parseErrors.map((err, index) => (
                                    <div key={index} className="text-yellow-800">{err}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Job Status */}
                    {jobStatus && (
                        <div className="mb-6">
                            <h3 className="font-semibold mb-3">Processing Status</h3>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`font-semibold ${
                                        jobStatus.status === 'completed' ? 'text-green-600' :
                                        jobStatus.status === 'failed' ? 'text-red-600' :
                                        jobStatus.status === 'processing' ? 'text-blue-600' :
                                        'text-gray-600'
                                    }`}>
                                        {jobStatus.status.charAt(0).toUpperCase() + jobStatus.status.slice(1)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Progress:</span>
                                    <span className="font-semibold">
                                        {jobStatus.processedUrls} / {jobStatus.totalUrls} URLs
                                    </span>
                                </div>

                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            jobStatus.status === 'failed' ? 'bg-red-600' :
                                            jobStatus.status === 'completed' ? 'bg-green-600' :
                                            'bg-blue-600'
                                        }`}
                                        style={{ width: `${jobStatus.progress}%` }}
                                    />
                                </div>

                                {jobStatus.errorMessage && (
                                    <div className="p-3 bg-red-50 rounded text-red-800 text-sm">
                                        {jobStatus.errorMessage}
                                    </div>
                                )}

                                {jobStatus.status === 'completed' && (
                                    <div className="flex items-center justify-center text-green-600 mt-4">
                                        <CheckCircle className="mr-2" size={20} />
                                        <span>Processing completed successfully!</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t bg-gray-50">
                    <div className="flex justify-between">
                        <button
                            onClick={reset}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            disabled={uploading || (jobStatus?.status === 'processing')}
                        >
                            Reset
                        </button>
                        <div className="space-x-3">
                            {jobStatus?.status === 'completed' && (
                                <button
                                    onClick={downloadResults}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                                >
                                    <Download className="mr-2" size={16} />
                                    Download Results
                                </button>
                            )}
                            {!jobId && (
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {uploading ? 'Uploading...' : 'Upload and Process'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CsvUploadModal;