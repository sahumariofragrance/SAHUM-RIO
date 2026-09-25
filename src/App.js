import React, { useState, useCallback, useEffect, lazy, Suspense } from "react";
import NavbarOptimized from "./components/NavbarOptimized";
import Footer from "./components/Footer";
import { useAuth } from "./context/AuthContext";
import { useProducts } from "./context/ProductsContext";
import { applySeo } from "./lib/seo";

const HomePage=lazy(()=>import("./pages/HomePage"));
const PerfumesPage=lazy(()=>import("./pages/PerfumesPage"));
const ProductPage=lazy(()=>import("./pages/ProductPage"));
const CartPage=lazy(()=>import("./pages/CartPage"));
const AboutPage=lazy(()=>import("./pages/AboutPage"));
const CheckoutPage=lazy(()=>import("./pages/CheckoutPage"));
const OrdersPage=lazy(()=>import("./pages/OrdersPage"));
const AccountPage=lazy(()=>import("./pages/AccountPage"));
const AdminDashboardPage=lazy(()=>import("./pages/AdminDashboardPage"));
const LoginPage=lazy(()=>import("./pages/LoginPage"));
const ResetPasswordPage=lazy(()=>import("./pages/ResetPasswordPage"));
const PrivacyPolicyPage=lazy(()=>import("./pages/PrivacyPolicyPage"));
const RefundPolicyPage=lazy(()=>import("./pages/RefundPolicyPage"));
const ShippingPolicyPage=lazy(()=>import("./pages/ShippingPolicyPage"));
const TermsPage=lazy(()=>import("./pages/TermsPage"));
const BulkOrdersPage=lazy(()=>import("./pages/BulkOrdersPage"));

const PAGE_PATH_MAP={home:"/",perfumes:"/perfumes",about:"/about",cart:"/cart",checkout:"/checkout",account:"/account",orders:"/account/orders",admin:"/admin",login:"/login","reset-password":"/reset-password","bulk-orders":"/bulk-orders","privacy-policy":"/privacy-policy","refund-policy":"/refund-return-policy","shipping-policy":"/shipping-policy",terms:"/terms-conditions"};
const PAGE_PATH_ALIASES={"/orders":"orders","/refund-policy":"refund-policy","/terms":"terms"};
const PAGE_META={
  home:{title:"SAHUMäRIO® | Eau de Parfum in India",description:"Discover the SAHUMäRIO® Eau de Parfum collection and shop fragrances online across India."},
  perfumes:{title:"Eau de Parfum Collection | SAHUMäRIO®",description:"Explore the complete SAHUMäRIO® Eau de Parfum collection, fragrance details, notes and current prices."},
  about:{title:"About SAHUMäRIO® | Independent Fragrance Brand",description:"Learn about SAHUMäRIO®, an independent fragrance brand creating a focused Eau de Parfum collection."},
  "bulk-orders":{title:"Bulk Perfume Orders & Corporate Gifting | SAHUMäRIO®",description:"Enquire about SAHUMäRIO® bulk fragrance orders and corporate gifting in India."},
  "privacy-policy":{title:"Privacy Policy | SAHUMäRIO®",description:"Read the SAHUMäRIO® privacy policy and how customer information is handled."},
  "refund-policy":{title:"Refund & Return Policy | SAHUMäRIO®",description:"Read the SAHUMäRIO® refund and return policy."},
  "shipping-policy":{title:"Shipping Policy | SAHUMäRIO®",description:"Read SAHUMäRIO® shipping and delivery information for orders in India."},
  terms:{title:"Terms & Conditions | SAHUMäRIO®",description:"Read the SAHUMäRIO® website and purchase terms and conditions."},
  cart:{title:"Your Cart | SAHUMäRIO®",description:"Review your SAHUMäRIO® shopping cart."},
  checkout:{title:"Checkout | SAHUMäRIO®",description:"Complete your SAHUMäRIO® order securely."},
  account:{title:"My Account | SAHUMäRIO®",description:"View your SAHUMäRIO® account details."},
  orders:{title:"My Orders | SAHUMäRIO®",description:"View your SAHUMäRIO® orders and shipment tracking."},
  admin:{title:"Admin | SAHUMäRIO®",description:"SAHUMäRIO® administration."},
  login:{title:"Log In or Sign Up | SAHUMäRIO®",description:"Log in or create your SAHUMäRIO® account."},
  "reset-password":{title:"Reset Password | SAHUMäRIO®",description:"Choose a new password for your SAHUMäRIO® account."}
};
const NOINDEX_PAGES=new Set(["cart","checkout","account","orders","admin","login","reset-password"]);
function PageSkeleton(){return <div className="mx-auto max-w-6xl px-4 py-16 animate-pulse" aria-hidden="true"><div className="h-8 w-48 rounded-lg bg-[var(--color-surface-muted)] mb-8"/><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3].map(i=><div key={i} className="rounded-xl bg-[var(--color-surface-muted)] aspect-[4/5]"/>)}</div></div>;}
export default function App(){const{user,loading:authLoading,isGuest}=useAuth();const{bySlug,loading:productsLoading}=useProducts();const getRouteFromPath=useCallback((pathname="/")=>{const p=pathname==="/"?"/":pathname.replace(/\/+$/,"");const productMatch=p.match(/^\/product\/([a-z0-9-]+)$/);if(productMatch)return{page:"product",slug:productMatch[1]};if(PAGE_PATH_ALIASES[p])return{page:PAGE_PATH_ALIASES[p],slug:null};return{page:Object.entries(PAGE_PATH_MAP).find(([,path])=>path===p)?.[0]||"home",slug:null};},[]);const[route,setRoute]=useState(()=>getRouteFromPath(window.location.pathname));const[isMenuOpen,setIsMenuOpen]=useState(false);const currentPage=route.page;
useEffect(()=>{
  if(currentPage==="product"){
    if(productsLoading)return;
    const product=bySlug.get(route.slug);
    if(product){
      applySeo({
        title:`${product.name} Eau de Parfum | SAHUMäRIO®`,
        description:product.description||`Discover ${product.name}, an Eau de Parfum by SAHUMäRIO®.`,
        path:`/product/${product.slug}`,
        image:product.image,
        imageAlt:product.alt||`${product.name} Eau de Parfum bottle`,
        type:"product",
        robots:"index, follow"
      });
    }else{
      applySeo({
        title:"Perfume Not Found | SAHUMäRIO®",
        description:"The requested SAHUMäRIO® perfume could not be found.",
        path:window.location.pathname,
        robots:"noindex, follow"
      });
    }
    return;
  }

  const meta=PAGE_META[currentPage]||PAGE_META.home;
  applySeo({
    ...meta,
    path:PAGE_PATH_MAP[currentPage]||"/",
    robots:NOINDEX_PAGES.has(currentPage)?"noindex, nofollow":"index, follow"
  });
},[currentPage,route.slug,bySlug,productsLoading]);
const navigatePath=useCallback((path,nextRoute)=>{setRoute(nextRoute);setIsMenuOpen(false);if(window.location.pathname!==path)window.history.pushState({},"",path);window.scrollTo({top:0,behavior:"smooth"});},[]);const handleSetCurrentPage=useCallback((page,options={})=>navigatePath(PAGE_PATH_MAP[page]||"/",{page,slug:null,...options}),[navigatePath]);const handleProductNavigate=useCallback(product=>{const slug=product?.slug;if(slug)navigatePath(`/product/${slug}`,{page:"product",slug});},[navigatePath]);useEffect(()=>{const pop=()=>{setRoute(getRouteFromPath(window.location.pathname));setIsMenuOpen(false);};window.addEventListener("popstate",pop);return()=>window.removeEventListener("popstate",pop);},[getRouteFromPath]);
const page=(()=>{switch(currentPage){case"home":return<HomePage onProductNavigate={handleProductNavigate} setCurrentPage={handleSetCurrentPage}/>;case"perfumes":return<PerfumesPage onProductNavigate={handleProductNavigate}/>;case"product":return<ProductPage slug={route.slug} navigate={handleSetCurrentPage}/>;case"cart":return<CartPage setCurrentPage={handleSetCurrentPage}/>;case"about":return<AboutPage/>;case"bulk-orders":return<BulkOrdersPage/>;case"checkout":return<CheckoutPage setCurrentPage={handleSetCurrentPage}/>;case"account":if(authLoading)return<div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"/></div>;return user&&!isGuest?<AccountPage setCurrentPage={handleSetCurrentPage}/>:<LoginPage setCurrentPage={handleSetCurrentPage} redirectAfterLogin="account"/>;case"orders":if(authLoading)return<div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"/></div>;return user&&!isGuest?<OrdersPage setCurrentPage={handleSetCurrentPage}/>:<LoginPage setCurrentPage={handleSetCurrentPage} redirectAfterLogin="orders"/>;case"reset-password":return<ResetPasswordPage setCurrentPage={handleSetCurrentPage}/>;case"admin":if(authLoading)return<div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"/></div>;if(!user||isGuest)return<LoginPage setCurrentPage={handleSetCurrentPage} redirectAfterLogin="admin"/>;return<AdminDashboardPage setCurrentPage={handleSetCurrentPage}/>;case"login":return user&&!isGuest?<OrdersPage setCurrentPage={handleSetCurrentPage}/>:<LoginPage setCurrentPage={handleSetCurrentPage} redirectAfterLogin={route.redirectAfterLogin||"home"} initialMessage={route.message}/>;case"privacy-policy":return<PrivacyPolicyPage/>;case"refund-policy":return<RefundPolicyPage/>;case"shipping-policy":return<ShippingPolicyPage/>;case"terms":return<TermsPage/>;default:return<PerfumesPage onProductNavigate={handleProductNavigate}/>;}})();return<div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-200"><NavbarOptimized currentPage={currentPage} setCurrentPage={handleSetCurrentPage} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen}/><main className="flex-1" id="main-content"><Suspense fallback={<PageSkeleton/>}>{page}</Suspense></main><Footer setCurrentPage={handleSetCurrentPage}/></div>;}
