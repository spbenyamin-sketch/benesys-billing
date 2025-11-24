--
-- PostgreSQL database dump
--

\restrict LpXH1cj5KDfSAXQVQZXVQdbCl0KrfhwopPrQGs7s2dJ8MjYuXF6sfbuDezkN6aa

-- Dumped from database version 16.9 (415ebe8)
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
-- SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


-- SET default_table_access_method = "heap";

--
-- Name: bill_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."bill_templates" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "header_text" "text",
    "footer_text" "text",
    "show_tax_breakup" boolean DEFAULT true NOT NULL,
    "show_hsn_code" boolean DEFAULT true NOT NULL,
    "show_item_code" boolean DEFAULT true NOT NULL,
    "paper_size" character varying(20) DEFAULT 'A4'::character varying NOT NULL,
    "font_size" integer DEFAULT 10 NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "created_by" character varying,
    "logo_url" "text",
    "company_id" integer NOT NULL
);


--
-- Name: bill_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."bill_templates_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bill_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."bill_templates_id_seq" OWNED BY "public"."bill_templates"."id";


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."companies" (
    "id" integer NOT NULL,
    "name" character varying(200) NOT NULL,
    "address" "text",
    "city" character varying(100),
    "gst_no" character varying(50),
    "phone" character varying(50),
    "email" character varying(100),
    "logo_url" "text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "state" character varying(100),
    "created_by" character varying
);


--
-- Name: company_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."company_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."company_id_seq" OWNED BY "public"."companies"."id";


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."items" (
    "id" integer NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(300) NOT NULL,
    "hsn_code" character varying(50),
    "category" character varying(100),
    "pack_type" character varying(20) DEFAULT 'PC'::character varying NOT NULL,
    "type" character varying(10) DEFAULT 'P'::character varying NOT NULL,
    "cost" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "tax" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    "cgst" numeric(5,3) DEFAULT '0'::numeric NOT NULL,
    "sgst" numeric(5,3) DEFAULT '0'::numeric NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "created_by" character varying,
    "company_id" integer NOT NULL
);


--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."items_id_seq" OWNED BY "public"."items"."id";


--
-- Name: parties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."parties" (
    "id" integer NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(200) NOT NULL,
    "address" "text",
    "city" character varying(100),
    "state" character varying(100),
    "state_code" character varying(10),
    "gst_no" character varying(50),
    "phone" character varying(50),
    "agent" character varying(100),
    "agent_code" integer,
    "opening_debit" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "opening_credit" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "created_by" character varying,
    "company_id" integer NOT NULL
);


--
-- Name: parties_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."parties_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: parties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."parties_id_seq" OWNED BY "public"."parties"."id";


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."payments" (
    "id" integer NOT NULL,
    "date" "date" NOT NULL,
    "party_id" integer,
    "party_name" character varying(200),
    "credit" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "debit" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "details" "text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "created_by" character varying,
    "company_id" integer NOT NULL
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."payments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."payments_id_seq" OWNED BY "public"."payments"."id";


--
-- Name: purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."purchases" (
    "id" integer NOT NULL,
    "purchase_no" integer NOT NULL,
    "date" "date" NOT NULL,
    "party_id" integer,
    "party_name" character varying(200),
    "amount" numeric(12,2) NOT NULL,
    "details" "text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "created_by" character varying,
    "company_id" integer NOT NULL
);


--
-- Name: purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."purchases_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."purchases_id_seq" OWNED BY "public"."purchases"."id";


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."sale_items" (
    "id" integer NOT NULL,
    "sale_id" integer NOT NULL,
    "item_id" integer,
    "item_code" character varying(50),
    "item_name" character varying(300) NOT NULL,
    "hsn_code" character varying(50),
    "quality" character varying(100),
    "size" character varying(50),
    "quantity" numeric(12,3) NOT NULL,
    "rate" numeric(12,2) NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "sale_value" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "tax_value" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "tax" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    "cgst" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "sgst" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "cgst_rate" numeric(5,3) DEFAULT '0'::numeric NOT NULL,
    "sgst_rate" numeric(5,3) DEFAULT '0'::numeric NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


--
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."sale_items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."sale_items_id_seq" OWNED BY "public"."sale_items"."id";


--
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."sales" (
    "id" integer NOT NULL,
    "invoice_no" integer NOT NULL,
    "bill_type" character varying(10) NOT NULL,
    "date" "date" NOT NULL,
    "time" character varying(10),
    "party_id" integer,
    "party_name" character varying(200),
    "party_city" character varying(100),
    "party_address" "text",
    "party_gst_no" character varying(50),
    "gst_type" integer DEFAULT 0 NOT NULL,
    "sale_value" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "tax_value" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "cgst_total" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "sgst_total" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "round_off" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "grand_total" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "total_qty" numeric(12,3) DEFAULT '0'::numeric NOT NULL,
    "amount_given" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "amount_return" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "by_card" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "by_cash" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "mobile" character varying(20),
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "created_by" character varying,
    "company_id" integer NOT NULL
);


--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."sales_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."sales_id_seq" OWNED BY "public"."sales"."id";


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."sessions" (
    "sid" character varying NOT NULL,
    "sess" "jsonb" NOT NULL,
    "expire" timestamp without time zone NOT NULL
);


--
-- Name: stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."stock" (
    "id" integer NOT NULL,
    "item_id" integer NOT NULL,
    "quantity" numeric(12,3) DEFAULT '0'::numeric NOT NULL,
    "last_updated" timestamp without time zone DEFAULT "now"() NOT NULL,
    "company_id" integer NOT NULL
);


--
-- Name: stock_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."stock_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."stock_id_seq" OWNED BY "public"."stock"."id";


--
-- Name: user_companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."user_companies" (
    "id" integer NOT NULL,
    "user_id" character varying NOT NULL,
    "company_id" integer NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


--
-- Name: user_companies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."user_companies_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."user_companies_id_seq" OWNED BY "public"."user_companies"."id";


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."users" (
    "id" character varying DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying,
    "first_name" character varying,
    "last_name" character varying,
    "profile_image_url" character varying,
    "role" character varying(20) DEFAULT 'user'::character varying NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "username" character varying(100),
    "password_hash" character varying(255)
);


--
-- Name: bill_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."bill_templates" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."bill_templates_id_seq"'::"regclass");


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."companies" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."company_id_seq"'::"regclass");


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."items_id_seq"'::"regclass");


--
-- Name: parties id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."parties" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."parties_id_seq"'::"regclass");


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."payments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."payments_id_seq"'::"regclass");


--
-- Name: purchases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."purchases" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."purchases_id_seq"'::"regclass");


--
-- Name: sale_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sale_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sale_items_id_seq"'::"regclass");


--
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sales" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sales_id_seq"'::"regclass");


--
-- Name: stock id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."stock" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."stock_id_seq"'::"regclass");


--
-- Name: user_companies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."user_companies" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_companies_id_seq"'::"regclass");


--
-- Data for Name: bill_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."bill_templates" ("id", "name", "header_text", "footer_text", "show_tax_breakup", "show_hsn_code", "show_item_code", "paper_size", "font_size", "is_default", "created_at", "updated_at", "created_by", "logo_url", "company_id") FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."companies" ("id", "name", "address", "city", "gst_no", "phone", "email", "logo_url", "created_at", "updated_at", "state", "created_by") FROM stdin;
1	Default Company	Default Address	Default City	DEFAULT-GST	\N	\N	\N	2025-11-23 10:25:05.623696	2025-11-23 10:25:05.623696	Default State	\N
2	Company A Test oa58hM	123 Test St	TestCity	TEST-GST-A	\N	\N	\N	2025-11-23 10:47:14.090577	2025-11-23 10:47:14.090577	\N	BNtCrj
3	Company B Test BDAiRI	456 Test Ave	TestCity	TEST-GST-B	\N	\N	\N	2025-11-23 10:47:14.192948	2025-11-23 10:47:14.192948	\N	BNtCrj
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."items" ("id", "code", "name", "hsn_code", "category", "pack_type", "type", "cost", "tax", "cgst", "sgst", "active", "created_at", "updated_at", "created_by", "company_id") FROM stdin;
1	ITEM001	Test Product	1234	Electronics	PC	P	100.75	18.00	9.000	9.000	t	2025-11-23 07:24:05.799027	2025-11-23 07:24:05.799027	BNtCrj	1
2	1	Saree	6103	Ladies	PC	P	0.00	5.00	2.500	2.500	t	2025-11-23 12:10:25.077343	2025-11-23 12:10:25.077343	228b93ae-870f-4959-8fea-8fb6e9b42b0c	3
\.


--
-- Data for Name: parties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."parties" ("id", "code", "name", "address", "city", "state", "state_code", "gst_no", "phone", "agent", "agent_code", "opening_debit", "opening_credit", "created_at", "updated_at", "created_by", "company_id") FROM stdin;
1	CUST001	Test Customer Ltd	123 Business Street	Mumbai	Maharashtra		27AAAAA0000A1Z5	9876543210		0	5000.50	0.00	2025-11-23 07:23:22.364099	2025-11-23 07:23:22.364099	BNtCrj	1
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."payments" ("id", "date", "party_id", "party_name", "credit", "debit", "details", "created_at", "updated_at", "created_by", "company_id") FROM stdin;
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."purchases" ("id", "purchase_no", "date", "party_id", "party_name", "amount", "details", "created_at", "updated_at", "created_by", "company_id") FROM stdin;
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."sale_items" ("id", "sale_id", "item_id", "item_code", "item_name", "hsn_code", "quality", "size", "quantity", "rate", "amount", "sale_value", "tax_value", "tax", "cgst", "sgst", "cgst_rate", "sgst_rate", "created_at") FROM stdin;
1	1	1	ITEM001	Test Product	1234	\N	\N	1.000	100.74	100.74	85.37	15.37	18.00	7.68	7.68	9.000	9.000	2025-11-23 09:42:10.646681
2	2	1	ITEM001	Test Product	1234	\N	\N	1.000	100.75	100.75	85.38	15.37	18.00	7.68	7.68	9.000	9.000	2025-11-23 11:08:49.866745
3	2	1	ITEM001	Test Product	1234	\N	\N	1.000	100.75	100.75	85.38	15.37	18.00	7.68	7.68	9.000	9.000	2025-11-23 11:08:50.179719
4	3	2	1	Saree	6103	\N	\N	1.000	500.00	500.00	476.19	23.81	5.00	11.90	11.90	2.500	2.500	2025-11-23 12:10:38.581792
5	4	2	1	Saree	6103	\N	\N	1.000	100.00	100.00	95.24	4.76	5.00	2.38	2.38	2.500	2.500	2025-11-23 12:58:58.682247
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."sales" ("id", "invoice_no", "bill_type", "date", "time", "party_id", "party_name", "party_city", "party_address", "party_gst_no", "gst_type", "sale_value", "tax_value", "cgst_total", "sgst_total", "round_off", "grand_total", "total_qty", "amount_given", "amount_return", "by_card", "by_cash", "mobile", "created_at", "updated_at", "created_by", "company_id") FROM stdin;
1	1	GST	2025-11-23	09:42:10	1	Test Customer Ltd	Mumbai	123 Business Street	27AAAAA0000A1Z5	0	85.37	15.37	7.68	7.68	0.26	101.00	1.000	0.00	-101.00	0.00	101.00		2025-11-23 09:42:10.540804	2025-11-23 09:42:10.540804	43730285	1
2	2	GST	2025-11-23	11:08:49	\N					0	170.76	30.74	15.37	15.37	0.50	202.00	2.000	0.00	-202.00	0.00	202.00		2025-11-23 11:08:49.758798	2025-11-23 11:08:49.758798	43730285	1
3	1	GST	2025-11-23	12:10:38	\N					0	476.19	23.81	11.90	11.90	0.00	500.00	1.000	0.00	-500.00	0.00	500.00		2025-11-23 12:10:38.475233	2025-11-23 12:10:38.475233	228b93ae-870f-4959-8fea-8fb6e9b42b0c	3
4	2	GST	2025-11-23	12:58:58	\N					0	95.24	4.76	2.38	2.38	0.00	100.00	1.000	0.00	-100.00	0.00	100.00		2025-11-23 12:58:58.576602	2025-11-23 12:58:58.576602	228b93ae-870f-4959-8fea-8fb6e9b42b0c	3
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."sessions" ("sid", "sess", "expire") FROM stdin;
9LUVjqP4ESD6imfkVvVQeLzbLxGRtf9M	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-30T12:30:49.088Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-30 12:31:04
Ul2cDs66894bfkccnpg9vDH_1TcGcfGM	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-30T13:02:20.116Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "228b93ae-870f-4959-8fea-8fb6e9b42b0c"}}	2025-12-01 04:47:25
kzbyPp2U7LUyVGoIExF6TcCBtBoPN-Ku	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-30T12:42:30.984Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "228b93ae-870f-4959-8fea-8fb6e9b42b0c"}}	2025-11-30 12:42:45
\.


--
-- Data for Name: stock; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."stock" ("id", "item_id", "quantity", "last_updated", "company_id") FROM stdin;
1	1	-3.000	2025-11-23 11:08:50.333	1
2	2	-2.000	2025-11-23 12:58:58.838	3
\.


--
-- Data for Name: user_companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."user_companies" ("id", "user_id", "company_id", "is_default", "created_at") FROM stdin;
1	BNtCrj	1	t	2025-11-23 10:25:49.701379
2	43730285	1	t	2025-11-23 10:25:49.701379
3	BNtCrj	2	f	2025-11-23 10:47:14.29298
4	BNtCrj	3	f	2025-11-23 10:47:14.29298
5	228b93ae-870f-4959-8fea-8fb6e9b42b0c	3	t	2025-11-23 12:07:27.222191
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."users" ("id", "email", "first_name", "last_name", "profile_image_url", "role", "created_at", "updated_at", "username", "password_hash") FROM stdin;
BNtCrj	BNtCrj@example.com	John	Doe	\N	user	2025-11-23 07:21:49.315043	2025-11-23 07:21:49.315043	\N	\N
228b93ae-870f-4959-8fea-8fb6e9b42b0c	\N	Admin	User	\N	admin	2025-11-23 11:57:31.148056	2025-11-23 11:57:31.148056	admin	$2b$10$Nn9rVLsgN4j4eKg19qbnuOuxy89k3SjWF/oxIasfiMM78pP1EkFNa
43730285	sp.benyamin@gmail.com	Benny	Ben	\N	user	2025-11-23 07:27:46.630797	2025-11-23 12:09:27.278	\N	\N
\.


--
-- Name: bill_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."bill_templates_id_seq"', 1, false);


--
-- Name: company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."company_id_seq"', 3, true);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."items_id_seq"', 2, true);


--
-- Name: parties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."parties_id_seq"', 1, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."payments_id_seq"', 1, false);


--
-- Name: purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."purchases_id_seq"', 1, false);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."sale_items_id_seq"', 5, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."sales_id_seq"', 4, true);


--
-- Name: stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."stock_id_seq"', 2, true);


--
-- Name: user_companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."user_companies_id_seq"', 7, true);


--
-- Name: bill_templates bill_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."bill_templates"
    ADD CONSTRAINT "bill_templates_pkey" PRIMARY KEY ("id");


--
-- Name: companies company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "company_pkey" PRIMARY KEY ("id");


--
-- Name: items items_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_code_unique" UNIQUE ("code");


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");


--
-- Name: parties parties_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."parties"
    ADD CONSTRAINT "parties_code_unique" UNIQUE ("code");


--
-- Name: parties parties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."parties"
    ADD CONSTRAINT "parties_pkey" PRIMARY KEY ("id");


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id");


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid");


--
-- Name: stock stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_pkey" PRIMARY KEY ("id");


--
-- Name: user_companies user_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."user_companies"
    ADD CONSTRAINT "user_companies_pkey" PRIMARY KEY ("id");


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_unique" UNIQUE ("email");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON "public"."sessions" USING "btree" ("expire");


--
-- Name: bill_templates bill_templates_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."bill_templates"
    ADD CONSTRAINT "bill_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");


--
-- Name: bill_templates bill_templates_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."bill_templates"
    ADD CONSTRAINT "bill_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: items items_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");


--
-- Name: items items_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: parties parties_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."parties"
    ADD CONSTRAINT "parties_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");


--
-- Name: parties parties_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."parties"
    ADD CONSTRAINT "parties_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: payments payments_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");


--
-- Name: payments payments_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: payments payments_party_id_parties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id");


--
-- Name: purchases purchases_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");


--
-- Name: purchases purchases_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: purchases purchases_party_id_parties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id");


--
-- Name: sale_items sale_items_item_id_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id");


--
-- Name: sale_items sale_items_sale_id_sales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id");


--
-- Name: sales sales_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");


--
-- Name: sales sales_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");


--
-- Name: sales sales_party_id_parties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id");


--
-- Name: stock stock_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");


--
-- Name: stock stock_item_id_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id");


--
-- Name: user_companies user_companies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."user_companies"
    ADD CONSTRAINT "user_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");


--
-- Name: user_companies user_companies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."user_companies"
    ADD CONSTRAINT "user_companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- PostgreSQL database dump complete
--

\unrestrict LpXH1cj5KDfSAXQVQZXVQdbCl0KrfhwopPrQGs7s2dJ8MjYuXF6sfbuDezkN6aa

