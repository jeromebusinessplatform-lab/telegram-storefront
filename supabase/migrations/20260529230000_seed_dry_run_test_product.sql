DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Dry Run Test Product'
  ) THEN
    INSERT INTO products (
      name,
      sub_name,
      description,
      price,
      images,
      stock,
      variants,
      is_active,
      sort_order
    ) VALUES (
      'Dry Run Test Product',
      'Checkout, delivery, and payment test item',
      'Temporary item for end-to-end dry runs. Safe to remove after testing.',
      10.00,
      '[]'::jsonb,
      100,
      '[]'::jsonb,
      TRUE,
      0
    );
  END IF;
END $$;
