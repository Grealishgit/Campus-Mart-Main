--
-- PostgreSQL database dump
--

\restrict Ol2GGefocqtxofmrG32aQwu4HCjYAU3ODeBKWYmEHNui3e6dZmb8bt27ypNWzDB

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(50),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    buyer_id uuid,
    seller_id uuid,
    sale_listing_id integer,
    lease_listing_id integer,
    type character varying(10),
    last_message text,
    last_message_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT conversations_type_check CHECK (((type)::text = ANY ((ARRAY['BUYING'::character varying, 'SELLING'::character varying, 'LEASING'::character varying])::text[])))
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO postgres;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorites (
    id integer NOT NULL,
    user_id uuid,
    sale_listing_id integer,
    lease_listing_id integer,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_favorite_one_listing CHECK ((((sale_listing_id IS NOT NULL) AND (lease_listing_id IS NULL)) OR ((lease_listing_id IS NOT NULL) AND (sale_listing_id IS NULL))))
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.favorites_id_seq OWNER TO postgres;

--
-- Name: favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.favorites_id_seq OWNED BY public.favorites.id;


--
-- Name: lease_listings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lease_listings (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    price_unit character varying(20) NOT NULL,
    min_duration integer,
    max_duration integer,
    duration_unit character varying(10),
    available_from date DEFAULT CURRENT_DATE NOT NULL,
    available_until date,
    category character varying(100) NOT NULL,
    condition character varying(50) NOT NULL,
    location character varying(150) NOT NULL,
    image_url text,
    is_verified boolean DEFAULT false,
    is_available boolean DEFAULT true,
    seller_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT lease_listings_condition_check CHECK (((condition)::text = ANY ((ARRAY['Brand New'::character varying, 'Like New'::character varying, 'Excellent'::character varying, 'Good'::character varying, 'Used - Like New'::character varying, 'Fair'::character varying])::text[]))),
    CONSTRAINT lease_listings_duration_unit_check CHECK (((duration_unit)::text = ANY ((ARRAY['hours'::character varying, 'days'::character varying, 'weeks'::character varying, 'months'::character varying])::text[]))),
    CONSTRAINT lease_listings_price_unit_check CHECK (((price_unit)::text = ANY ((ARRAY['/hour'::character varying, '/day'::character varying, '/week'::character varying, '/month'::character varying])::text[])))
);


ALTER TABLE public.lease_listings OWNER TO postgres;

--
-- Name: lease_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lease_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lease_listings_id_seq OWNER TO postgres;

--
-- Name: lease_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lease_listings_id_seq OWNED BY public.lease_listings.id;


--
-- Name: logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logs (
    id integer NOT NULL,
    level character varying(20) DEFAULT 'info'::character varying,
    message text NOT NULL,
    source character varying(100),
    user_id uuid,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT logs_level_check CHECK (((level)::text = ANY ((ARRAY['info'::character varying, 'warning'::character varying, 'error'::character varying, 'success'::character varying])::text[])))
);


ALTER TABLE public.logs OWNER TO postgres;

--
-- Name: logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logs_id_seq OWNER TO postgres;

--
-- Name: logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logs_id_seq OWNED BY public.logs.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer,
    sender_id uuid,
    text text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    buyer_id uuid,
    seller_id uuid,
    sale_listing_id integer,
    lease_listing_id integer,
    type character varying(10) NOT NULL,
    amount numeric(10,2) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying,
    lease_start date,
    lease_end date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_lease_dates CHECK (((((type)::text = 'LEASE'::text) AND (lease_start IS NOT NULL) AND (lease_end IS NOT NULL) AND (lease_end > lease_start)) OR (((type)::text = 'SALE'::text) AND (lease_start IS NULL) AND (lease_end IS NULL)))),
    CONSTRAINT chk_listing_matches_type CHECK (((((type)::text = 'SALE'::text) AND (sale_listing_id IS NOT NULL) AND (lease_listing_id IS NULL)) OR (((type)::text = 'LEASE'::text) AND (lease_listing_id IS NOT NULL) AND (sale_listing_id IS NULL)))),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT orders_type_check CHECK (((type)::text = ANY ((ARRAY['SALE'::character varying, 'LEASE'::character varying])::text[])))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    reviewer_id uuid,
    reviewed_user_id uuid,
    sale_listing_id integer,
    lease_listing_id integer,
    rating integer,
    comment text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: sale_listings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sale_listings (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    category character varying(100) NOT NULL,
    condition character varying(50) NOT NULL,
    location character varying(150) NOT NULL,
    image_url text,
    is_verified boolean DEFAULT false,
    is_available boolean DEFAULT true,
    is_sold boolean DEFAULT false,
    sold_at timestamp without time zone,
    seller_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT sale_listings_condition_check CHECK (((condition)::text = ANY ((ARRAY['Brand New'::character varying, 'Like New'::character varying, 'Excellent'::character varying, 'Good'::character varying, 'Used - Like New'::character varying, 'Fair'::character varying])::text[])))
);


ALTER TABLE public.sale_listings OWNER TO postgres;

--
-- Name: sale_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sale_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_listings_id_seq OWNER TO postgres;

--
-- Name: sale_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sale_listings_id_seq OWNED BY public.sale_listings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'student'::character varying,
    avatar_url text,
    is_verified boolean DEFAULT false,
    faculty character varying(100),
    rating numeric(2,1) DEFAULT 0.0,
    total_sales integer DEFAULT 0,
    active_listings integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    location character varying(100),
    otp_code character varying(6),
    otp_expires_at timestamp with time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'vendor'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: favorites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites ALTER COLUMN id SET DEFAULT nextval('public.favorites_id_seq'::regclass);


--
-- Name: lease_listings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lease_listings ALTER COLUMN id SET DEFAULT nextval('public.lease_listings_id_seq'::regclass);


--
-- Name: logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs ALTER COLUMN id SET DEFAULT nextval('public.logs_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: sale_listings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_listings ALTER COLUMN id SET DEFAULT nextval('public.sale_listings_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, icon, created_at) FROM stdin;
1	Textbooks	book	2026-04-23 21:38:17.108337
2	Tech	laptop	2026-04-23 21:38:17.108337
3	Dorm Decor	home	2026-04-23 21:38:17.108337
4	Bikes	bicycle	2026-04-23 21:38:17.108337
5	Leisure	game-controller	2026-04-23 21:38:17.108337
6	Electronics	flash	2026-04-23 21:38:17.108337
7	Clothing	shirt	2026-04-23 21:38:17.108337
8	Household	basket	2026-04-23 21:38:17.108337
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, buyer_id, seller_id, sale_listing_id, lease_listing_id, type, last_message, last_message_at, created_at) FROM stdin;
1	3d3c41d1-704f-4e20-a1f5-eb9278d6e495	3b864e48-4741-453d-8cb5-61b42a03f85a	4	\N	BUYING	\N	2026-04-27 02:17:59.759974	2026-04-27 02:17:59.759974
2	3d3c41d1-704f-4e20-a1f5-eb9278d6e495	3b864e48-4741-453d-8cb5-61b42a03f85a	6	\N	BUYING	\N	2026-04-27 02:22:49.557437	2026-04-27 02:22:49.557437
4	3d3c41d1-704f-4e20-a1f5-eb9278d6e495	3b864e48-4741-453d-8cb5-61b42a03f85a	3	\N	BUYING	\N	2026-04-27 02:25:22.673008	2026-04-27 02:25:22.673008
3	3d3c41d1-704f-4e20-a1f5-eb9278d6e495	3b864e48-4741-453d-8cb5-61b42a03f85a	\N	4	LEASING	Hello	2026-04-27 03:26:38.773111	2026-04-27 02:23:17.607991
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorites (id, user_id, sale_listing_id, lease_listing_id, created_at) FROM stdin;
1	3b864e48-4741-453d-8cb5-61b42a03f85a	4	\N	2026-04-27 01:46:00.89008
9	3d3c41d1-704f-4e20-a1f5-eb9278d6e495	8	\N	2026-04-27 01:53:02.717745
11	3d3c41d1-704f-4e20-a1f5-eb9278d6e495	3	\N	2026-04-27 02:05:14.713331
13	3d3c41d1-704f-4e20-a1f5-eb9278d6e495	2	\N	2026-04-27 02:07:25.153732
\.


--
-- Data for Name: lease_listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lease_listings (id, title, description, price, price_unit, min_duration, max_duration, duration_unit, available_from, available_until, category, condition, location, image_url, is_verified, is_available, seller_id, created_at, updated_at) FROM stdin;
2	Bed Bug Mattress Protector (Single Size)	Essential for hostel life. Used for one semester but still clean.	3500.00	/day	1	14	days	2026-04-25	2026-05-30	Tech	Good	Kathemboni	https://res.cloudinary.com/djn0olfaj/image/upload/v1776975317/campus-mart/listings/image-1776975315958-714976425.webp	f	t	3b864e48-4741-453d-8cb5-61b42a03f85a	2026-04-23 23:15:17.419854	2026-04-23 23:15:17.419854
1	Canon DSLR Camera	Available for events and projects, includes charger and memory card.	1500.00	/day	1	14	days	2026-04-25	2026-05-30	Tech	Like New	Mksu Main Gate	https://res.cloudinary.com/djn0olfaj/image/upload/v1776975482/campus-mart/listings/image-1776975480756-922427860.jpg	f	t	3b864e48-4741-453d-8cb5-61b42a03f85a	2026-04-23 22:56:15.460313	2026-04-23 23:18:36.937304
3	Bed Bug Mattress Protector (Single Size)	Essential for hostel life. Used for one semester but still clean.	3500.00	/day	1	14	days	2026-04-25	2026-05-30	Tech	Good	Kathemboni	https://res.cloudinary.com/djn0olfaj/image/upload/v1776975482/campus-mart/listings/image-1776975480756-922427860.jpg	t	t	3b864e48-4741-453d-8cb5-61b42a03f85a	2026-04-23 23:18:02.601266	2026-04-23 23:34:35.455135
4	Claude book	A book filled with claude commands	200.00	/week	5	14	days	2026-04-27	2026-05-02	Textbooks	Good	Century Park	https://res.cloudinary.com/djn0olfaj/image/upload/v1777228884/campus-mart/listings/image-1777228883197-904134180.jpg	f	t	3b864e48-4741-453d-8cb5-61b42a03f85a	2026-04-26 21:41:25.012802	2026-04-26 22:25:39.099791
\.


--
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logs (id, level, message, source, user_id, metadata, created_at) FROM stdin;
1	success	Admin logged in: admin@campusmart.ac.ke	loginAdmin	557ff427-007c-4c69-b3f0-90995cf331d3	\N	2026-04-27 05:10:28.944363
2	warning	Wrong password for admin: admin@campusmart.ac.ke	loginAdmin	\N	\N	2026-04-27 05:31:22.951957
3	warning	Wrong password for admin: admin@campusmart.ac.ke	loginAdmin	\N	\N	2026-04-27 05:31:38.898226
4	success	Admin logged in: admin@campusmart.ac.ke	loginAdmin	557ff427-007c-4c69-b3f0-90995cf331d3	\N	2026-04-27 05:31:47.395273
5	success	Admin logged in: admin@campusmart.ac.ke	loginAdmin	557ff427-007c-4c69-b3f0-90995cf331d3	\N	2026-04-27 05:56:22.283636
6	success	Admin logged in: superadmin@campusmart.ac.ke	loginAdmin	ac6156f9-b5b9-4103-8a91-f3777e731193	\N	2026-04-27 06:00:48.689167
7	success	Admin logged in: admin@campusmart.ac.ke	loginAdmin	557ff427-007c-4c69-b3f0-90995cf331d3	\N	2026-04-27 06:02:17.533008
8	warning	Wrong password for admin: superadmin@campusmart.ac.ke	loginAdmin	\N	\N	2026-04-27 06:58:39.456739
9	success	Admin logged in: superadmin@campusmart.ac.ke	loginAdmin	ac6156f9-b5b9-4103-8a91-f3777e731193	\N	2026-04-27 06:58:59.311324
10	success	Admin logged in: admin@campusmart.ac.ke	loginAdmin	557ff427-007c-4c69-b3f0-90995cf331d3	\N	2026-04-27 13:00:24.15712
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, conversation_id, sender_id, text, is_read, created_at) FROM stdin;
1	3	3d3c41d1-704f-4e20-a1f5-eb9278d6e495	Hello	t	2026-04-27 02:23:37.06146
2	3	3b864e48-4741-453d-8cb5-61b42a03f85a	Hello	f	2026-04-27 03:26:38.58076
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, buyer_id, seller_id, sale_listing_id, lease_listing_id, type, amount, status, lease_start, lease_end, created_at, updated_at) FROM stdin;
1	24fd6bc3-2950-4cb4-99c0-346c8aea785b	3b864e48-4741-453d-8cb5-61b42a03f85a	7	\N	SALE	3500.00	pending	\N	\N	2026-04-26 20:21:53.069693	2026-04-26 20:21:53.069693
2	24fd6bc3-2950-4cb4-99c0-346c8aea785b	3b864e48-4741-453d-8cb5-61b42a03f85a	\N	2	LEASE	14000.00	pending	2026-04-29	2026-05-03	2026-04-26 20:23:41.029136	2026-04-26 20:23:41.029136
4	700d30de-9ae9-426f-ae8e-823f88383023	3b864e48-4741-453d-8cb5-61b42a03f85a	\N	4	LEASE	1400.00	cancelled	2026-04-27	2026-06-12	2026-04-26 22:21:47.685322	2026-04-26 22:25:39.099791
6	3b864e48-4741-453d-8cb5-61b42a03f85a	700d30de-9ae9-426f-ae8e-823f88383023	5	\N	SALE	800.00	pending	\N	\N	2026-04-27 00:50:19.274714	2026-04-27 00:50:19.274714
3	700d30de-9ae9-426f-ae8e-823f88383023	3b864e48-4741-453d-8cb5-61b42a03f85a	9	\N	SALE	21999.00	completed	\N	\N	2026-04-26 22:11:35.659962	2026-04-27 05:00:16.234169
5	700d30de-9ae9-426f-ae8e-823f88383023	3b864e48-4741-453d-8cb5-61b42a03f85a	\N	1	LEASE	13500.00	completed	2026-04-29	2026-05-08	2026-04-26 22:24:07.815374	2026-04-27 12:59:36.256634
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, reviewer_id, reviewed_user_id, sale_listing_id, lease_listing_id, rating, comment, created_at) FROM stdin;
\.


--
-- Data for Name: sale_listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sale_listings (id, title, description, price, category, condition, location, image_url, is_verified, is_available, is_sold, sold_at, seller_id, created_at, updated_at) FROM stdin;
3	OfficeTable	student office study table	5000.00	Textbooks	Good	Kathemboni	https://res.cloudinary.com/djn0olfaj/image/upload/v1776974358/campus-mart/listings/image-1776974353881-609291964.jpg	f	t	f	\N	3b864e48-4741-453d-8cb5-61b42a03f85a	2026-04-23 22:59:18.179375	2026-04-23 22:59:18.179375
4	Hp Laptop	student office study table	5000.00	Tech	Good	Kathemboni	https://res.cloudinary.com/djn0olfaj/image/upload/v1776974440/campus-mart/listings/image-1776974437156-648022105.jpg	f	t	f	\N	3b864e48-4741-453d-8cb5-61b42a03f85a	2026-04-23 23:00:40.867534	2026-04-23 23:00:40.867534
6	Bed Bug Mattress Protector (Single Size)	Essential for hostel life. Used for one semester but still clean.	3500.00	Tech	Good	Kathemboni	https://res.cloudinary.com/djn0olfaj/image/upload/v1776974981/campus-mart/listings/image-1776974980044-176691075.webp	f	t	f	\N	3b864e48-4741-453d-8cb5-61b42a03f85a	2026-04-23 23:09:41.355526	2026-04-23 23:09:41.355526
2	OfficeTable	student office study table	5000.00	Textbooks	Good	Kathemboni	https://res.cloudinary.com/djn0olfaj/image/upload/v1776975482/campus-mart/listings/image-1776975480756-922427860.jpg	f	t	f	\N	3b864e48-4741-453d-8cb5-61b42a03f85a	2026-04-23 22:58:39.131683	2026-04-23 23:19:15.555608
1	Engineering Mathematics Textbook	Clean copy with no missing pages, suitable for first and second year students.	1800.00	Textbooks	Good	Mksu Main Campus, Hostel A	https://res.cloudinary.com/djn0olfaj/image/upload/v1776975482/campus-mart/listings/image-1776975480756-922427860.jpg	f	t	f	\N	3b864e48-4741-453d-8cb5-61b42a03f85a	2026-04-23 22:55:57.184519	2026-04-23 23:19:39.962967
7	Bed Bug Mattress Protector (Single Size)	Essential for hostel life. Used for one semester but still clean.	3500.00	Tech	Good	Kathemboni	https://res.cloudinary.com/djn0olfaj/image/upload/v1776975288/campus-mart/listings/image-1776975287340-883122505.webp	f	f	t	2026-04-26 20:21:53.069693	3b864e48-4741-453d-8cb5-61b42a03f85a	2026-04-23 23:14:48.95216	2026-04-26 20:21:53.069693
9	Laptop	Modern laptop for sale	21999.00	Tech	Like New	Kathemboni	https://res.cloudinary.com/djn0olfaj/image/upload/v1777228169/campus-mart/listings/image-1777228168069-145354446.jpg	f	f	t	2026-04-26 22:11:35.659962	3b864e48-4741-453d-8cb5-61b42a03f85a	2026-04-26 21:29:30.114952	2026-04-26 22:11:35.659962
8	Laptop keyboards	Modern laptop keyboards for all laptops	1999.00	Tech	Good	Kathemboni	https://res.cloudinary.com/djn0olfaj/image/upload/v1777240103/campus-mart/listings/image-1777240101857-7126636.jpg	f	t	f	\N	3b864e48-4741-453d-8cb5-61b42a03f85a	2026-04-26 20:54:34.920004	2026-04-27 00:48:24.388399
5	Portable speaker	Small but loud battery lasts longer	800.00	Tech	Good	Kathemboni	https://res.cloudinary.com/djn0olfaj/image/upload/v1777235804/campus-mart/listings/image-1777235803554-138803204.jpg	f	f	t	2026-04-27 00:50:19.274714	700d30de-9ae9-426f-ae8e-823f88383023	2026-04-23 23:06:59.005037	2026-04-27 00:50:19.274714
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, avatar_url, is_verified, faculty, rating, total_sales, active_listings, created_at, updated_at, location, otp_code, otp_expires_at) FROM stdin;
557ff427-007c-4c69-b3f0-90995cf331d3	Campus Admin	admin@campusmart.ac.ke	$2a$10$0wokumaFMQ5nt6skgkQ9B.Z/vt7QmreVYSbMJ0QAQsEeJQZOFsWp2	admin	\N	t	Administration	0.0	0	0	2026-04-23 21:38:18.946253	2026-04-23 21:38:18.946253	\N	\N	\N
ac6156f9-b5b9-4103-8a91-f3777e731193	Marketplace Admin	superadmin@campusmart.ac.ke	$2a$10$IWnQOmbB8Ex3wv8ZTU8Lh.aG2ZL9b6qI1jiosA.cgaaDZerXwvu9i	admin	\N	t	Operations	0.0	0	0	2026-04-23 21:38:19.16042	2026-04-23 21:38:19.16042	\N	\N	\N
55de6953-c6f7-45a9-9c42-0c5f35e59826	Demo Student	student@students.campusmart.ac.ke	$2a$10$vcHRbFy8GNl2GyGWOkaamOf3tM2nJWDshWPAyOhewh8kwtZWZtPHq	student	\N	t	Engineering	0.0	0	0	2026-04-23 21:38:19.417106	2026-04-23 21:38:19.417106	\N	\N	\N
6d28791c-7bd6-4df0-9e6f-fbb7d22a59e0	Alex Mwania	j17-1790-2022@student.mksu.ac.ke	$2a$10$9fyzVhYGGCmY2pMrOPCnHO8psp9D5HDlVNoqXqLxg/89D3BJhLeNi	student	\N	f	ICT	0.0	0	0	2026-04-23 22:40:14.508836	2026-04-23 22:40:14.508836	\N	\N	\N
83802c70-725e-41f3-82f9-8eb16a1031dd	Hunter	j17-1237-2023@student.mksu.ac.ke	$2a$10$vi2dgYhsOeX2Hnal89lpJ.QCTrXOhB0UzleuduUPSVR.R9c49ZuLS	student	\N	f	Education	0.0	0	0	2026-04-26 13:17:16.687539	2026-04-26 13:17:16.687539	\N	\N	\N
3b864e48-4741-453d-8cb5-61b42a03f85a	Bryant Wanoo	j17-1354-2022@student.mksu.ac.ke	$2a$10$UGuxnG0XS1zHv2y2ye5maOtFTWWc0zl.aZgOu2XHG4iAGQWaTu3He	student	https://res.cloudinary.com/djn0olfaj/image/upload/v1777240176/campus-mart/avatars/avatar-1777240174968-469607929.jpg	f	Education	0.0	2	10	2026-04-23 22:46:47.75884	2026-04-27 01:21:46.22085	\N	\N	\N
3d3c41d1-704f-4e20-a1f5-eb9278d6e495	Hunter	j12-1234@student.mksu.ac.ke	$2a$10$eox1FycKatO3u2FuGtP3xO8IcgG/wzDQDV2J9BF9p1C.3FTog6Wse	student	https://res.cloudinary.com/djn0olfaj/image/upload/v1777245675/campus-mart/avatars/avatar-1777245673556-678267220.jpg	f	\N	0.0	0	0	2026-04-26 13:34:37.756601	2026-04-27 02:21:15.923009	\N	\N	\N
24fd6bc3-2950-4cb4-99c0-346c8aea785b	Hunter	hunter123@gmail.com	$2a$10$etOQJsSIyp7vpLvtwjBF0.4vZsYdenB5WATG6WnUeB9JFXfYMtrs2	vendor	\N	t	\N	0.0	0	0	2026-04-26 13:52:16.360895	2026-04-27 04:08:54.473245	\N	\N	\N
700d30de-9ae9-426f-ae8e-823f88383023	Eugene Maina	s09-1861-2022@student.mksu.ac.ke	$2a$10$vmtKZGgcKoRk81DVduwe6euWQtooSYZ7P9NLaU4dhBXcjtMu/tpHy	student	https://res.cloudinary.com/djn0olfaj/image/upload/v1777236671/campus-mart/avatars/avatar-1777236670403-676866342.jpg	t	Education	0.0	1	0	2026-04-23 22:31:44.268037	2026-04-27 04:09:01.363155	\N	\N	\N
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 8, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversations_id_seq', 4, true);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.favorites_id_seq', 13, true);


--
-- Name: lease_listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lease_listings_id_seq', 4, true);


--
-- Name: logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.logs_id_seq', 10, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 2, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 6, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_id_seq', 1, false);


--
-- Name: sale_listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sale_listings_id_seq', 9, true);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_user_id_lease_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_lease_listing_id_key UNIQUE (user_id, lease_listing_id);


--
-- Name: favorites favorites_user_id_sale_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_sale_listing_id_key UNIQUE (user_id, sale_listing_id);


--
-- Name: lease_listings lease_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lease_listings
    ADD CONSTRAINT lease_listings_pkey PRIMARY KEY (id);


--
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: orders no_lease_overlap; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT no_lease_overlap EXCLUDE USING gist (lease_listing_id WITH =, daterange(lease_start, lease_end, '[]'::text) WITH &&) WHERE ((((type)::text = 'LEASE'::text) AND ((status)::text <> 'cancelled'::text)));


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: sale_listings sale_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_listings
    ADD CONSTRAINT sale_listings_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_favorites_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favorites_user ON public.favorites USING btree (user_id);


--
-- Name: idx_lease_listings_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lease_listings_category ON public.lease_listings USING btree (category);


--
-- Name: idx_lease_listings_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lease_listings_dates ON public.lease_listings USING btree (available_from, available_until);


--
-- Name: idx_lease_listings_seller; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lease_listings_seller ON public.lease_listings USING btree (seller_id);


--
-- Name: idx_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_created_at ON public.logs USING btree (created_at DESC);


--
-- Name: idx_logs_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_level ON public.logs USING btree (level);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id);


--
-- Name: idx_orders_buyer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_buyer ON public.orders USING btree (buyer_id);


--
-- Name: idx_orders_lease_listing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_lease_listing ON public.orders USING btree (lease_listing_id);


--
-- Name: idx_orders_sale_listing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_sale_listing ON public.orders USING btree (sale_listing_id);


--
-- Name: idx_orders_seller; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_seller ON public.orders USING btree (seller_id);


--
-- Name: idx_orders_type_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_type_status ON public.orders USING btree (type, status);


--
-- Name: idx_sale_listings_available; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sale_listings_available ON public.sale_listings USING btree (is_available, is_sold);


--
-- Name: idx_sale_listings_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sale_listings_category ON public.sale_listings USING btree (category);


--
-- Name: idx_sale_listings_seller; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sale_listings_seller ON public.sale_listings USING btree (seller_id);


--
-- Name: lease_listings update_lease_listings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_lease_listings_updated_at BEFORE UPDATE ON public.lease_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sale_listings update_sale_listings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_sale_listings_updated_at BEFORE UPDATE ON public.sale_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: conversations conversations_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_lease_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_lease_listing_id_fkey FOREIGN KEY (lease_listing_id) REFERENCES public.lease_listings(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_sale_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_sale_listing_id_fkey FOREIGN KEY (sale_listing_id) REFERENCES public.sale_listings(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_lease_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_lease_listing_id_fkey FOREIGN KEY (lease_listing_id) REFERENCES public.lease_listings(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_sale_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_sale_listing_id_fkey FOREIGN KEY (sale_listing_id) REFERENCES public.sale_listings(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lease_listings lease_listings_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lease_listings
    ADD CONSTRAINT lease_listings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: logs logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: orders orders_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: orders orders_lease_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_lease_listing_id_fkey FOREIGN KEY (lease_listing_id) REFERENCES public.lease_listings(id) ON DELETE SET NULL;


--
-- Name: orders orders_sale_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_sale_listing_id_fkey FOREIGN KEY (sale_listing_id) REFERENCES public.sale_listings(id) ON DELETE SET NULL;


--
-- Name: orders orders_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_lease_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_lease_listing_id_fkey FOREIGN KEY (lease_listing_id) REFERENCES public.lease_listings(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_reviewed_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewed_user_id_fkey FOREIGN KEY (reviewed_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_sale_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_sale_listing_id_fkey FOREIGN KEY (sale_listing_id) REFERENCES public.sale_listings(id) ON DELETE SET NULL;


--
-- Name: sale_listings sale_listings_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_listings
    ADD CONSTRAINT sale_listings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Ol2GGefocqtxofmrG32aQwu4HCjYAU3ODeBKWYmEHNui3e6dZmb8bt27ypNWzDB

