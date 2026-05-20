import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import FilterSelect from '../components/ui/FilterSelect';
import { toast } from 'react-hot-toast';
import { Paperclip, X, FileText, UploadCloud } from 'lucide-react';

export default function CreateLoan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [formData, setFormData] = useState({
    applicantName: '',
    nic: '',
    phone: '',
    region: '',
    sector: '',
    amountRequested: '',
    description: '',
    permanentAddress: ''
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [regRes, secRes] = await Promise.all([
          api.get('/loans/regions'),
          api.get('/loans/sectors')
        ]);
        setRegions(regRes.data.map(r => r.name || r));
        setSectors(secRes.data.map(s => s.name || s));
      } catch (err) {
         console.error("Metadata fetch error:", err);
         toast.error("Failed to load regions/sectors");
      }
    };
    fetchMetadata();
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
   data.append('applicantName', formData.applicantName);
   data.append('nic', formData.nic);
   data.append('phone', formData.phone);
   data.append('region', formData.region);
   data.append('sector', formData.sector);
   data.append('amountRequested', formData.amountRequested);
   data.append('description', formData.description);
   data.append('permanentAddress', formData.permanentAddress);

   selectedFiles.forEach(file => data.append('attachments', file));

    try {
      await api.post('/loans/apply', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Loan application submitted successfully!");
      navigate('/applications');
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mt-10 mb-20">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">New Loan Application</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Applicant Name</label>
            <input
              type="text" required
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.applicantName}
              onChange={(e) => setFormData({...formData, applicantName: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">NIC Number</label>
            <input
              type="text" required
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.nic}
              onChange={(e) => setFormData({...formData, nic: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
            <FilterSelect
              options={regions}
              value={formData.region}
              onChange={(val) => setFormData({...formData, region: val})}
              placeholder="Select Region"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sector</label>
            <FilterSelect
              options={sectors}
              value={formData.sector}
              onChange={(val) => setFormData({...formData, sector: val})}
              placeholder="Select Sector"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount Requested (LKR)</label>
            <input
              type="number" required
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.amountRequested}
              onChange={(e) => setFormData({...formData, amountRequested: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input
              type="text" required
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </div>

         <div>
         <label className="block text-sm font-medium text-slate-700 mb-1">Permanent Address</label>
         <textarea
            rows="2"
            required
            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            value={formData.permanentAddress}
            onChange={(e) => setFormData({...formData, permanentAddress: e.target.value})}
         ></textarea>
         </div>
         
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Brief Description</label>
          <textarea
            rows="3"
            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          ></textarea>
        </div>

        {/* --- Attachment Section --- */}
        <div className="border-t border-slate-100 pt-6">
          <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Paperclip size={18} className="text-emerald-600" /> Proof of Documents (PDF, Excel, Images)
          </label>
          
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />
                <p className="text-sm text-slate-500 font-medium">Click to upload files</p>
                <p className="text-xs text-slate-400 mt-1">PDF, XLSX, JPG, PNG</p>
              </div>
              <input type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.xlsx,.xls,image/*" />
            </label>
          </div>

          {/* List of Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={16} className="text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-600 truncate">{file.name}</span>
                  </div>
                  <button type="button" onClick={() => removeFile(index)} className="p-1 hover:bg-red-50 text-red-400 rounded-full">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
          <button
            type="button" onClick={() => navigate(-1)}
            className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit" disabled={loading}
            className={`px-8 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all text-sm shadow-md shadow-emerald-100 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Uploading...' : 'Submit Loan Application'}
          </button>
        </div>
      </form>
    </div>
  );
}