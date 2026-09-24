import React from 'react';
import { Outlet } from 'react-router-dom';
import { Brand } from '../components/common/Sidebar';

export const AuthLayout: React.FC = () => (
  <div className="min-h-screen bg-canvas grid lg:grid-cols-[1.1fr_1fr]">
    {/* Editorial panel */}
    <section className="hidden lg:flex flex-col justify-between p-12 border-r border-line">
      <Brand />
      <div className="max-w-md">
        <p className="font-serif text-[56px] leading-[1.02] text-ink">
          Campus operations,
          <br />
          <span className="italic text-ink-3">quietly handled.</span>
        </p>
        <p className="text-sm text-ink-3 mt-6 leading-relaxed max-w-sm">
          Classrooms, medical response and the cafeteria in one place, for the people who keep the campus running.
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-6 max-w-md text-[13px]">
        {[
          ['Classrooms', 'Bookings & facilities'],
          ['Medical', 'Emergency dispatch'],
          ['Cafeteria', 'Orders & menu'],
        ].map(([title, text]) => (
          <div key={title} className="border-t border-line pt-3">
            <dt className="text-ink font-medium">{title}</dt>
            <dd className="text-ink-3 mt-0.5">{text}</dd>
          </div>
        ))}
      </dl>
    </section>

    {/* Form panel */}
    <section className="flex flex-col justify-center px-6 py-12 sm:px-12 bg-surface">
      <div className="lg:hidden mb-10">
        <Brand />
      </div>
      <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-12">
        <Outlet />
      </div>
    </section>
  </div>
);
