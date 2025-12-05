-- Migration: Capacity Management Functions
-- Description: Functions to increase/decrease tour date capacity

-- Decrease capacity when booking is made
CREATE OR REPLACE FUNCTION mysiacrm.decrease_tour_date_capacity(date_id UUID, pax_count INT)
RETURNS void AS $$
BEGIN
  UPDATE mysiacrm.tour_dates
  SET capacity_available = capacity_available - pax_count
  WHERE id = date_id;
  
  -- Update status if sold out
  UPDATE mysiacrm.tour_dates
  SET status = 'soldout'
  WHERE id = date_id AND capacity_available <= 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increase capacity when booking is cancelled
CREATE OR REPLACE FUNCTION mysiacrm.increase_tour_date_capacity(date_id UUID, pax_count INT)
RETURNS void AS $$
BEGIN
  UPDATE mysiacrm.tour_dates
  SET capacity_available = capacity_available + pax_count,
      status = 'available'
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
