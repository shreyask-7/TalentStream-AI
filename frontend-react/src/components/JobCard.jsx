import React from "react";
import { motion } from "framer-motion";

const JobCard = ({ job, onDelete, onApply, onManage }) => {
  const isRecruiter = !!onManage || !!onDelete;
  const parsedSkills = Array.isArray(job.skills)
    ? job.skills
    : typeof job.skills === "string"
      ? job.skills.split(",").map((s) => s.trim())
      : [];

  return (
    //  Convert standard div to motion.div with animation props
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700/50 hover:border-blue-500/50 hover:shadow-blue-500/10 transition-colors w-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100">{job.title}</h3>
          <p className="text-blue-400 font-medium">{job.company}</p>
        </div>
        <span className="px-3 py-1 bg-slate-900 text-slate-300 text-xs font-semibold rounded-full border border-slate-700">
          Full-time
        </span>
      </div>

      <p className="text-slate-400 text-sm mb-6 line-clamp-2">
        {job.description}
      </p>

      {/* Render AI Skills */}
      {parsedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {parsedSkills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-slate-900/80 text-slate-300 border border-slate-700 rounded-full text-xs font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-start gap-4 pt-4 border-t border-slate-700/50">
        {isRecruiter ? (
          <>
            {onManage && (
              <button
                onClick={() => onManage(job)}
                className="px-4 py-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 font-semibold rounded-lg transition-all text-sm"
              >
                Manage Candidates
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(job.id)}
                className="px-4 py-2 bg-slate-900 text-red-400 hover:bg-red-500 hover:text-white border border-slate-700 font-semibold rounded-lg transition-all text-sm"
              >
                Delete Role
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => onApply(job)}
            className="px-6 py-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 font-semibold rounded-lg transition-all text-sm flex items-center gap-2"
          >
            Apply Now 🚀
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default JobCard;
