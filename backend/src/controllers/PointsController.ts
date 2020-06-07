import { Request, Response, request } from 'express';
import knex from '../config/database';

interface IPointItems {
  name: string;
  email: string;
  whatsapp: string;
  longitude: number;
  latitude: number;
  city: string;
  uf: string;
}

class PointsController {
  async index(response: Response) {
    const { city, uf, items } = request.query;

    const parsedItems = String(items)
      .split(',')
      .map((item) => Number(item.trim()));

    const points = knex('points')
      .join('point_items', 'points.id', '=', 'point_items.point_id')
      .whereIn('point_items.item.id', parsedItems)
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*');

    return response.json(points);
  }

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const point = await knex('points').where('id', id).first();

    if (!point) {
      return response.status(400).json({ error: 'Ponto não encontrado!' });
    }

    const items = await knex('items')
      .join('point_items', 'items.id', '=', 'point_items.item_id')
      .where('point_items.point.id', id);

    return response.json({ point, items });
  }

  async store(request: Request, response: Response) {
    const {
      name,
      email,
      whatsapp,
      longitude,
      latitude,
      city,
      uf,
      items,
    } = request.body;

    const point = {
      image:
        'https://images.unsplash.com/photo-1556767576-aa7f4d92262b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60',
      name,
      email,
      whatsapp,
      longitude,
      latitude,
      city,
      uf,
    };

    const trx = await knex.transaction();

    const insertedIDs = await trx('points').insert(point);

    const point_id = insertedIDs[0];

    const poitItem = items.map((item_id: number) => {
      return {
        item_id,
        point_id,
      };
    });

    await trx('point_items').insert(poitItem);

    trx.commit();

    return response.send({
      id: point_id,
      ...point,
    });
  }
}

export default new PointsController();