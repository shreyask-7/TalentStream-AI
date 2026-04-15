const JobCard = ({ job, onDelete }) => {
  return (
    <div className="bg-slate-800 border border-slate-700/50 p-6 rounded-2xl shadow-lg hover:shadow-blue-500/10 hover:border-blue-500/50 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
          {job.title}
        </h3>
        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold px-3 py-1 rounded-full">
          Full-time
        </span>
      </div>

      <p className="text-blue-400 font-medium mb-4">{job.company}</p>

      {/* line-clamp-3 ensures long descriptions don't break the card size */}
      <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">
        {job.description}
      </p>

      {/* Skills Pill Badges */}
      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-5">
          {job.skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-slate-900/80 text-blue-300 text-xs rounded-full border border-slate-700"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Footer / Actions */}
      <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-between items-center">
        <button className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
          View Details →
        </button>

        {/* We only want to show delete if onDelete is passed (Recruiter view) */}
        {onDelete && (
          <button
            onClick={() => onDelete(job.id)}
            className="text-sm text-red-400 hover:text-red-300 transition-colors cursor-pointer px-3 py-1 hover:bg-red-500/10 rounded-lg"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default JobCard;
