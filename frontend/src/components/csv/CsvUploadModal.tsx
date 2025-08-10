import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, User } from 'lucide-react';
import Modal from '../Modal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface CsvUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProfilesTracked?: (profiles: any[]) => void;
}

interface ProcessedProfile {
    username: string;
    profile_link: string;
    profile_pic_url: string;
    posts: Array<{
        url: string;
        instagram_id: string;
        caption: string;
        hashtags: string[];
        thumbnail_url: string;
        embed_link: string;
        tag: string;
    }>;
}

const CsvUploadModal: React.FC<CsvUploadModalProps> = ({ isOpen, onClose, onProfilesTracked }) => {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [profiles, setProfiles] = useState<ProcessedProfile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [parseErrors, setParseErrors] = useState<string[]>([]);
    const [failures, setFailures] = useState<Array<{url: string, error: string}>>([]);
    const [stats, setStats] = useState<{total: number, success: number, failed: number} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                setError('Please select a CSV file');
                return;
            }
            setFile(selectedFile);
            setError(null);
            // Reset previous results
            setProfiles([]);
            setFailures([]);
            setStats(null);
        }
    };

    const handleProcess = async () => {
        if (!file) return;

        setProcessing(true);
        setError(null);
        setParseErrors([]);
        setProfiles([]);
        setFailures([]);

        const formData = new FormData();
        formData.append('csv', file);
        formData.append('skipHeader', 'true');
        formData.append('maxRows', '100');

        try {
            const response = await fetch(`${API_BASE_URL}/csv-batch/process`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Processing failed');
            }

            setProfiles(data.profiles || []);
            setFailures(data.failures || []);
            setParseErrors(data.parseErrors || []);
            setStats({
                total: data.totalProcessed,
                success: data.successCount,
                failed: data.failedCount
            });

            // Notify parent component about tracked profiles
            if (onProfilesTracked && data.profiles.length > 0) {
                onProfilesTracked(data.profiles);
            }
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Processing failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleTrackProfile = (profile: ProcessedProfile) => {
        // Start tracking this profile
        fetch(`${API_BASE_URL}/instagram/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: profile.username })
        }).then(response => response.json())
          .then(data => {
              if (data.success) {
                  alert(`Started tracking @${profile.username}`);
              }
          });
    };

    const downloadSample = async () => {
        const sampleCsv = `url,tag
https://www.instagram.com/p/ABC123/,fashion
https://www.instagram.com/reel/DEF456/,travel`;
        
        const blob = new Blob([sampleCsv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'instagram_urls_sample.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setProfiles([]);
        setError(null);
        setParseErrors([]);
        setFailures([]);
        setStats(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={handleClose} 
            title="Import Instagram URLs from CSV"
            maxWidth="xl"
        >
            <div className="space-y-6">
                {/* Instructions */}
                <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">CSV Format</h3>
                    <p className="text-sm text-blue-800 mb-2">
                        Upload a CSV with Instagram post/reel URLs. We'll extract profile information from each URL.
                    </p>
                    <button onClick={downloadSample} className="text-sm text-blue-600 hover:text-blue-800 underline">
                        Download sample CSV
                    </button>
                </div>

                {/* File Upload */}
                {!stats && (
                    <div>
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
                                    <p className="text-sm text-gray-400 mt-1">Max 100 URLs</p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-red-50 rounded-lg flex items-start">
                        <AlertCircle className="text-red-600 mr-2 flex-shrink-0" size={20} />
                        <span className="text-red-800">{error}</span>
                    </div>
                )}

                {/* Statistics */}
                {stats && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                            <div className="text-sm text-gray-600">Total URLs</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                            <div className="text-sm text-gray-600">Successful</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                            <div className="text-sm text-gray-600">Failed</div>
                        </div>
                    </div>
                )}

                {/* Profiles Found */}
                {profiles.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-3">Instagram Profiles Found</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {profiles.map((profile, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        {profile.profile_pic_url ? (
                                            <img 
                                                src={profile.profile_pic_url} 
                                                alt={profile.username}
                                                className="w-10 h-10 rounded-full mr-3"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                                                <User size={20} className="text-gray-600" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium">@{profile.username}</div>
                                            <div className="text-sm text-gray-600">
                                                {profile.posts.length} post{profile.posts.length !== 1 ? 's' : ''} found
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleTrackProfile(profile)}
                                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                                    >
                                        Track Profile
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Failures */}
                {failures.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2 text-red-600">Failed URLs</h3>
                        <div className="max-h-32 overflow-y-auto bg-red-50 p-3 rounded text-sm">
                            {failures.map((failure, index) => (
                                <div key={index} className="text-red-800 mb-1">
                                    {failure.url}: {failure.error}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Parse Errors */}
                {parseErrors.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">Parse Warnings</h3>
                        <div className="max-h-32 overflow-y-auto bg-yellow-50 p-3 rounded text-sm">
                            {parseErrors.map((err, index) => (
                                <div key={index} className="text-yellow-800">{err}</div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between border-t pt-4">
                    <button
                        onClick={reset}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        disabled={processing}
                    >
                        Reset
                    </button>
                    <div className="space-x-3">
                        {profiles.length > 0 && (
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                <CheckCircle className="inline mr-2" size={16} />
                                Done
                            </button>
                        )}
                        {!stats && file && (
                            <button
                                onClick={handleProcess}
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                            >
                                {processing ? 'Processing...' : 'Process CSV'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CsvUploadModal;