// ===== App.jsx =====
import React, { useEffect, useState } from "react";
import "./style.css";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

export default function App() {
  const [players, setPlayers] = useState([]);
  const [cars, setCars] = useState([]);

  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [carName, setCarName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [editingCarId, setEditingCarId] = useState(null);

  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [loadingCars, setLoadingCars] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "players"), orderBy("name", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const playersData = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        setPlayers(playersData);
        setLoadingPlayers(false);
      },
      (error) => {
        console.error("players read error:", error);
        alert("選手データの取得に失敗しました。Firestoreの設定を確認してください。");
        setLoadingPlayers(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "cars"), orderBy("carName", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const carsData = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        setCars(carsData);
        setLoadingCars(false);
      },
      (error) => {
        console.error("cars read error:", error);
        alert("車両データの取得に失敗しました。Firestoreの設定を確認してください。");
        setLoadingCars(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setName("");
    setEditingId(null);
  };

  const resetCarForm = () => {
    setCarName("");
    setDriverName("");
    setCapacity("");
    setEditingCarId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      alert("名前を入力してください。");
      return;
    }

    const isDuplicate = players.some(
      (player) => player.name === trimmedName && player.id !== editingId
    );

    if (isDuplicate) {
      alert("同じ名前がすでに登録されています。");
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, "players", editingId), {
          name: trimmedName,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "players"), {
          name: trimmedName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      resetForm();
    } catch (error) {
      console.error("players save error:", error);
      alert("選手データの保存に失敗しました。");
    }
  };

  const handleEdit = (player) => {
    setName(player.name);
    setEditingId(player.id);
  };

  const handleDelete = async (id) => {
    const target = players.find((player) => player.id === id);
    if (!target) return;

    const ok = window.confirm(`${target.name} を削除しますか？`);
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "players", id));

      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      console.error("players delete error:", error);
      alert("選手データの削除に失敗しました。");
    }
  };

  const handleCarSubmit = async (e) => {
    e.preventDefault();

    const trimmedCarName = carName.trim();
    const trimmedDriverName = driverName.trim();
    const numberCapacity = Number(capacity);

    if (!trimmedCarName || !trimmedDriverName || capacity === "") {
      alert("車名・運転者名・定員を入力してください。");
      return;
    }

    if (!Number.isInteger(numberCapacity) || numberCapacity <= 0) {
      alert("定員は1以上の整数で入力してください。");
      return;
    }

    const isDuplicateCar = cars.some(
      (car) => car.carName === trimmedCarName && car.id !== editingCarId
    );

    if (isDuplicateCar) {
      alert("同じ車名がすでに登録されています。");
      return;
    }

    try {
      if (editingCarId) {
        await updateDoc(doc(db, "cars", editingCarId), {
          carName: trimmedCarName,
          driverName: trimmedDriverName,
          capacity: numberCapacity,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "cars"), {
          carName: trimmedCarName,
          driverName: trimmedDriverName,
          capacity: numberCapacity,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      resetCarForm();
    } catch (error) {
      console.error("cars save error:", error);
      alert("車両データの保存に失敗しました。");
    }
  };

  const handleCarEdit = (car) => {
    setCarName(car.carName);
    setDriverName(car.driverName);
    setCapacity(String(car.capacity));
    setEditingCarId(car.id);
  };

  const handleCarDelete = async (id) => {
    const target = cars.find((car) => car.id === id);
    if (!target) return;

    const ok = window.confirm(`${target.carName} を削除しますか？`);
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "cars", id));

      if (editingCarId === id) {
        resetCarForm();
      }
    } catch (error) {
      console.error("cars delete error:", error);
      alert("車両データの削除に失敗しました。");
    }
  };

  const playerCount = players.length;
  const carCount = cars.length;

  return (
    <div className="app">
      <div className="phone-frame">
        <header className="app-header">
          <div className="team-title">⚾ 南町ファイターズ</div>
          <div className="team-subtitle">配車アプリ設定</div>
        </header>

        <main className="content">
          <section className="card form-card">
            <h2 className="section-title">選手登録</h2>

            <form onSubmit={handleSubmit} className="player-form">
              <div className="form-group">
                <label htmlFor="name">選手名</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：山田 太郎"
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="primary-btn">
                  {editingId ? "更新" : "登録"}
                </button>
                <button type="button" className="secondary-btn" onClick={resetForm}>
                  クリア
                </button>
              </div>
            </form>
          </section>

          <section className="summary-grid">
            <div className="card summary-card summary-card-single">
              <div className="summary-label">登録選手数</div>
              <div className="summary-value">{playerCount}名</div>
            </div>
          </section>

          <section className="list-section">
            <div className="list-title">選手一覧</div>

            {loadingPlayers ? (
              <div className="card empty-card">読み込み中です...</div>
            ) : players.length === 0 ? (
              <div className="card empty-card">登録データがありません。</div>
            ) : (
              players.map((player) => (
                <div className="card player-card" key={player.id}>
                  <div className="player-card-bar"></div>
                  <div className="player-card-body">
                    <div>
                      <div className="player-name">{player.name}</div>
                    </div>

                    <div className="player-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => handleEdit(player)}
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDelete(player.id)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="card form-card car-form-card">
            <h2 className="section-title">車両登録</h2>

            <form onSubmit={handleCarSubmit} className="player-form">
              <div className="form-group">
                <label htmlFor="carName">車名</label>
                <input
                  id="carName"
                  type="text"
                  value={carName}
                  onChange={(e) => setCarName(e.target.value)}
                  placeholder="例：佐藤家ミニバン"
                />
              </div>

              <div className="form-group">
                <label htmlFor="driverName">運転者名</label>
                <input
                  id="driverName"
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="例：佐藤 健一"
                />
              </div>

              <div className="form-group">
                <label htmlFor="capacity">定員</label>
                <input
                  id="capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="例：7"
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="primary-btn">
                  {editingCarId ? "更新" : "登録"}
                </button>
                <button type="button" className="secondary-btn" onClick={resetCarForm}>
                  クリア
                </button>
              </div>
            </form>
          </section>

          <section className="summary-grid">
            <div className="card summary-card summary-card-single">
              <div className="summary-label">登録車両数</div>
              <div className="summary-value">{carCount}台</div>
            </div>
          </section>

          <section className="list-section">
            <div className="list-title">車両一覧</div>

            {loadingCars ? (
              <div className="card empty-card">読み込み中です...</div>
            ) : cars.length === 0 ? (
              <div className="card empty-card">登録車両がありません。</div>
            ) : (
              cars.map((car) => (
                <div className="card car-card" key={car.id}>
                  <div className="player-card-bar"></div>
                  <div className="player-card-body">
                    <div>
                      <div className="player-name">{car.carName}</div>
                      <div className="car-meta">運転者：{car.driverName}</div>
                      <div className="car-meta">定員：{car.capacity}名</div>
                    </div>

                    <div className="player-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => handleCarEdit(car)}
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleCarDelete(car.id)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
