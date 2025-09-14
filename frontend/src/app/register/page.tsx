"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import Link from "next/link";

const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setError("");
      router.push("/home"); // Redirect to /home after successful registration
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col justify-center items-center w-1/3 p-4">
    <form onSubmit={handleRegister}>
      <div className="mb-8">
        <h3>Make an account with TypeChuzz</h3>
      <h1 className="pt-4">Email</h1>
        <div className="rounded-md border border-gray-300 p-2 bg-input">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      </div>
      <h1 className="pt-4">Password</h1>
        <div className="rounded-md border border-gray-300 p-2 bg-input">
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      </div>
      </div>
      <div>
      <button type="submit" className="bg-accent px-4 py-2 rounded-md w-full mt-4 hover:bg-secondary text-white">Register</button>
      {error && <p style={{color: "red"}}>{error}</p>}
      </div>
    </form>

    <div className="mt-4">Already have an account? Click <span><Link href="/login" passHref><button className="text-accent hover:underline">here</button></Link></span>.</div>
    </div>
    <div className="w-2/3 flex items-center justify-center bg-bglight">
      <img src="/register.png" alt="Register Illustration" className="object-contain h-full w-full" />
    </div>
    </div>
  );
};

export default Register;