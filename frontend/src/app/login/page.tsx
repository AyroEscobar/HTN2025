"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import Link from "next/link";
import Image from "next/image";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError("");
      router.push("/hoam"); // Redirect to /hoam after successful login
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col justify-center items-center w-1/3 p-20 ">
        <Image src={"Logo.svg"} alt="Logo" width={329} height={139} className="w-1/3 mb-20" />
        <form onSubmit={handleLogin} className="w-full">
          <div className="mb-8 w-full">
            <h3>Log into Routed</h3>
            <div className="flex flex-col">
              <small className="pt-4">Email</small>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="rounded-md border border-gray-300 p-2 bg-input"
                required
              />
            </div>
            <div className="flex flex-col">
              <small className="pt-4">Password</small>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="rounded-md border border-gray-300 p-2 bg-input"
                required
              />
            </div>
          </div>
          <div>
            <button type="submit" className="bg-accent px-4 py-2 rounded-md w-full mt-4 hover:bg-secondary text-white">Login</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </div>
        </form>

        <div className="mt-4">Don't have an account? Click <span><Link href="/register" passHref><button className="text-accent hover:underline">here</button></Link></span>.</div>
      </div>
      <div className="w-2/3 flex items-center justify-center bg-bglight">
        <img src="/register.png" alt="Register Illustration" className="object-contain h-full w-full" />
      </div>
    </div>
  );
};

export default Login;
