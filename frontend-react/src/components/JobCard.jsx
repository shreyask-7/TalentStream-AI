const JobCard = ({ job, onDelete }) => {
    return (
        <div className="bg-gray-800 border borderr-gray-700 p-5 rounded-xl shadow-lg hover:border-blue-500 transition duration-300">
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-white">{job.title}</h3>
                <span className="bg-blue-900 text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded">Full-time</span>
            </div>
            <p className="text-blue-400 font-medium mb-2">{job.company}</p>
            <p className="text-gray-400 text-sm line-clamp-3">{job.description}</p>

            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                <button className="text-sm text-gray-400 hover:text-white transition">View Details</button>
                <button onClick={() => onDelete(job.id)} className="text-sm text-red-400 hover:text-red-300 transition cursor-pointer">Delete</button>
            </div>
        </div>
    );
};

export default JobCard;