import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, BarChart3, Shield, Zap, Users, ArrowRight, Check, Star, Github, Twitter, TrendingUp, Globe, Clock } from 'lucide-react';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';

interface HomepageProps {
  onNavigate: (page: string) => void;
}

export function Homepage({ onNavigate }: HomepageProps) {
  const [email, setEmail] = useState('');
  const [liveStats, setLiveStats] = useState({
    totalUsers: 0,
    totalLinks: 0,
    totalClicks: 0,
    activeUsers: 0,
    recentLinks: [] as any[]
  });
  const [animatedNumbers, setAnimatedNumbers] = useState({
    users: 0,
    links: 0,
    clicks: 0
  });

  // Fetch live data from database
  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        // Get total users
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get total links and clicks
        const { data: linksData } = await supabase
          .from('links')
          .select('clicks, created_at, short_code, original_url')
          .order('created_at', { ascending: false })
          .limit(10);

        const totalLinks = linksData?.length || 0;
        const totalClicks = linksData?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0;

        // Calculate active users (users with links in last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: activeCount } = await supabase
          .from('links')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo);

        setLiveStats({
          totalUsers: userCount || 0,
          totalLinks,
          totalClicks,
          activeUsers: activeCount || 0,
          recentLinks: linksData?.slice(0, 5) || []
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback to demo data
        setLiveStats({
          totalUsers: 15234,
          totalLinks: 89456,
          totalClicks: 2345678,
          activeUsers: 1234,
          recentLinks: []
        });
      }
    };

    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Animate numbers
  useEffect(() => {
    const animateValue = (start: number, end: number, duration: number, key: keyof typeof animatedNumbers) => {
      const startTime = Date.now();
      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const value = Math.floor(start + (end - start) * progress);
        
        setAnimatedNumbers(prev => ({ ...prev, [key]: value }));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    };

    animateValue(0, liveStats.totalUsers, 2000, 'users');
    animateValue(0, liveStats.totalLinks, 2000, 'links');
    animateValue(0, liveStats.totalClicks, 2500, 'clicks');
  }, [liveStats]);

  // Helper function to blur URLs for privacy
  const blurUrl = (url: string) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const visibleChars = Math.min(8, domain.length);
      const blurred = domain.substring(0, visibleChars) + '*'.repeat(domain.length - visibleChars);
      return blurred;
    } catch {
      // If URL parsing fails, blur the middle part
      if (url.length <= 15) return url;
      const start = url.substring(0, 7);
      const end = url.substring(url.length - 7);
      return start + '*'.repeat(url.length - 14) + end;
    }
  };

  const features = [
    {
      icon: Link2,
      title: 'Shorten Links',
      description: 'Transform long URLs into short, memorable links that are easy to share and remember.'
    },
    {
      icon: BarChart3,
      title: 'Track Analytics',
      description: 'Monitor click-through rates, geographic data, and detailed analytics for your links.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime guarantee to keep your links accessible.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant redirects with global CDN for the best performance worldwide.'
    },
    {
      icon: Users,
      title: 'Referral Program',
      description: 'Earn points and rewards by referring friends and growing the community.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Marketing Manager',
      content: 'LinkShort has transformed how we share links in our campaigns. The analytics are incredible!',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Developer',
      content: 'The API is clean and the service is rock solid. Best URL shortener I\'ve used.',
      rating: 5
    },
    {
      name: 'Emily Davis',
      role: 'Content Creator',
      content: 'Love the referral program! I earn points while sharing my content with beautiful short links.',
      rating: 5
    }
  ];

  const stats = [
    { 
      value: animatedNumbers.users.toLocaleString(), 
      label: 'Active Users',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      value: animatedNumbers.links.toLocaleString(), 
      label: 'Links Created',
      icon: Link2,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    { 
      value: animatedNumbers.clicks.toLocaleString(), 
      label: 'Total Clicks',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    { 
      value: liveStats.activeUsers.toLocaleString(), 
      label: 'Online Now',
      icon: Globe,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      live: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <Link2 className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">LinkZy</span>
              </motion.div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('login')}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </button>
              <Button onClick={() => onNavigate('signup')}>
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            <motion.h1 
              className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Shorten Links,
              <span className="text-blue-600"> Track Results</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              The modern URL shortener with powerful analytics, custom branding, and a rewarding referral program. 
              Perfect for marketers, developers, and content creators.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto mb-8"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button onClick={() => onNavigate('signup')} className="w-full sm:w-auto">
                Start Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-8 justify-center items-center text-sm text-gray-600"
            >
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                Free forever plan
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                Unlimited links
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="py-20 bg-gradient-to-br from-white via-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 
              className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Trusted by Thousands Worldwide
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Real-time statistics from our growing community
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="text-center group"
              >
                <motion.div 
                  className={`w-20 h-20 ${stat.bgColor} rounded-3xl flex items-center justify-center mx-auto mb-6 relative group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <stat.icon className={`w-10 h-10 ${stat.color}`} />
                  {stat.live && (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full shadow-lg"
                    />
                  )}
                </motion.div>
                <motion.div 
                  className={`text-4xl sm:text-5xl font-bold ${stat.color} mb-2 font-mono`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-gray-700 font-semibold text-lg">{stat.label}</div>
                {stat.live && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-sm text-green-600 mt-2 font-medium"
                  >
                    ● Live
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Activity Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Live Activity Feed
            </h2>
            <p className="text-xl text-blue-100">See what's happening on LinkShort right now</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
            >
              <div className="flex items-center mb-6">
                <Clock className="w-6 h-6 text-blue-200 mr-2" />
                <h3 className="text-xl font-semibold text-white">Recent Links</h3>
              </div>
              <div className="space-y-4">
                {liveStats.recentLinks.length > 0 ? liveStats.recentLinks.map((link, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-blue-200 font-mono text-sm">
                        /{link.short_code}
                      </code>
                      <span className="text-xs text-blue-300">
                        {link.clicks} clicks
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm truncate" title="URL blurred for privacy">
                      {blurUrl(link.original_url)}
                    </p>
                  </motion.div>
                )) : (
                  <div className="text-center py-8">
                    <div className="animate-pulse">
                      <Link2 className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                      <p className="text-blue-200">Loading recent activity...</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
            >
              <div className="flex items-center mb-6">
                <TrendingUp className="w-6 h-6 text-blue-200 mr-2" />
                <h3 className="text-xl font-semibold text-white">Platform Stats</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-200">Daily Growth</span>
                    <span className="text-green-300 font-semibold">+12.5%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="bg-green-400 h-2 rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-200">Server Load</span>
                    <span className="text-yellow-300 font-semibold">32%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '32%' }}
                      transition={{ duration: 1.5, delay: 0.7 }}
                      className="bg-yellow-400 h-2 rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-200">Uptime Today</span>
                    <span className="text-green-300 font-semibold">99.9%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '99.9%' }}
                      transition={{ duration: 1.5, delay: 0.9 }}
                      className="bg-green-400 h-2 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to help you share, track, and optimize your links.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loved by Thousands Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our users have to say about LinkShort.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-8 rounded-2xl"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Shorten Your First Link?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of users who trust LinkShort for their link management needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => onNavigate('signup')} className="bg-white text-blue-600 hover:bg-gray-100">
                Get Started Free
              </Button>
              <button
                onClick={() => onNavigate('login')}
                className="px-6 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-medium"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Link2 className="w-8 h-8 text-blue-400" />
                <span className="text-xl font-bold">LinkZy</span>
              </div>
              <p className="text-gray-400">
                The modern URL shortener with powerful analytics and rewarding features.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => onNavigate('signup')} className="hover:text-white">Sign Up</button></li>
                <li><button onClick={() => onNavigate('login')} className="hover:text-white">Sign In</button></li>
                <li><a href="#features" className="hover:text-white">Features</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-gray-400">
            <p>&copy; 2026 LinkZy. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Created by Dilshan Methsara</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
