CREATE TABLE categories (
    id      SERIAL PRIMARY KEY,        
    name    VARCHAR(100) NOT NULL UNIQUE  
);

CREATE TABLE products (
    id           SERIAL PRIMARY KEY,   
    name         VARCHAR(200) NOT NULL,  
    brand        VARCHAR(100) NOT NULL DEFAULT '',
    category_id  INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    description  TEXT,
    image_url    VARCHAR(500),
    emoji        VARCHAR(20),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_specs (
    id           SERIAL PRIMARY KEY,    
    product_id   INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    spec_text    VARCHAR(255) NOT NULL,  
    sort_order   INT NOT NULL DEFAULT 0  
);

CREATE TABLE stores (
    id                SERIAL PRIMARY KEY,     
    name              VARCHAR(100) NOT NULL UNIQUE,  
    base_url          VARCHAR(255) NOT NULL,  
    affiliate_param   VARCHAR(50),   
    affiliate_id      VARCHAR(100)   
);

CREATE TABLE listings (
    id             SERIAL PRIMARY KEY,   
    product_id     INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id       INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    price          NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(10,2) CHECK (original_price >= 0),
    rating         NUMERIC(2,1) CHECK (rating BETWEEN 0 AND 5),
    reviews_count  INT NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
    shipping_info  VARCHAR(255),  
    product_url    VARCHAR(500) NOT NULL,  
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, store_id)
);

CREATE TABLE price_history (
    id           BIGSERIAL PRIMARY KEY,
    listing_id   INT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    price        NUMERIC(10,2) NOT NULL CHECK (price >= 0), 
    recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now()  
);
 
CREATE TABLE users (
    id             SERIAL PRIMARY KEY,  
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    display_name   VARCHAR(100),
    avatar_url     TEXT,          -- รูปโปรไฟล์ (data URL png/jpeg/webp) ตั้งผ่าน /api/account/profile
    role           VARCHAR(20) NOT NULL DEFAULT 'user'
                       CHECK (role IN ('admin', 'user')),
    status         VARCHAR(20) NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'pending')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()  
);

CREATE TABLE search_history (
    id            BIGSERIAL PRIMARY KEY,
    user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keyword       VARCHAR(255) NOT NULL,  
    searched_at   TIMESTAMPTZ NOT NULL DEFAULT now() 
);

CREATE TABLE admin_audit_logs (
    id             SERIAL PRIMARY KEY,
    actor_user_id  INT REFERENCES users(id) ON DELETE SET NULL,
    action         VARCHAR(20) NOT NULL,
    entity         VARCHAR(20) NOT NULL,
    entity_id      VARCHAR(100) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX admin_audit_logs_created_at_idx ON admin_audit_logs(created_at);
