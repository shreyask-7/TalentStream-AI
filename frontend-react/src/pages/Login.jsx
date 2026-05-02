import React from "react";

export default function Login({
  isLoginMode,
  setIsLoginMode,
  authForm,
  handleAuthChange,
  handleLogin,
  handleRegister,
}) {
  return (
    <div className="max-w-md mx-auto mt-20 bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700/50">
      <h2 className="text-2xl font-bold text-center mb-6 text-slate-100">
        {isLoginMode ? "Welcome Back" : "Create Account"}
      </h2>
      <form
        onSubmit={isLoginMode ? handleLogin : handleRegister}
        className="flex flex-col gap-4"
      >
        {!isLoginMode && (
          <>
            <div className="flex gap-4">
              <input
                type="text"
                name="firstName"
                value={authForm.firstName}
                onChange={handleAuthChange}
                placeholder="First Name"
                className="w-1/2 p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
                required
              />
              <input
                type="text"
                name="lastName"
                value={authForm.lastName}
                onChange={handleAuthChange}
                placeholder="Last Name"
                className="w-1/2 p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
                required
              />
            </div>
            <input
              type="email"
              name="email"
              value={authForm.email}
              onChange={handleAuthChange}
              placeholder="Email Address"
              className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
              required
            />
          </>
        )}
        <input
          type="text"
          name="username"
          value={authForm.username}
          onChange={handleAuthChange}
          placeholder={isLoginMode ? "Username or Email" : "Choose a Username"}
          className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
          required
        />
        <input
          type="password"
          name="password"
          value={authForm.password}
          onChange={handleAuthChange}
          placeholder="Password"
          className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
          required
        />

        {!isLoginMode && (
          <select
            name="role"
            value={authForm.role}
            onChange={handleAuthChange}
            className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer text-slate-200"
          >
            <option value="ROLE_CANDIDATE">I am a Candidate</option>
            <option value="ROLE_RECRUITER">I am a Recruiter</option>
          </select>
        )}
        <button
          type="submit"
          className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
        >
          {isLoginMode ? "Login to TalentStream" : "Complete Registration"}
        </button>
      </form>
      <div className="mt-6 text-center">
        <button
          onClick={() => setIsLoginMode(!isLoginMode)}
          className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
        >
          {isLoginMode
            ? "Need an account? Sign up here."
            : "Already have an account? Log in."}
        </button>
      </div>
    </div>
  );
}
